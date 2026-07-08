"""Home Assistant integration for the PrintStream bridge."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import voluptuous as vol

from . import media_source  # noqa: F401
from .api import PrintStreamBridgeApiClient, PrintStreamBridgeApiError
from .const import (
    CARD_RESOURCE_FILENAME,
    CARD_RESOURCE_URL,
    CARD_RESOURCE_VERSION,
    CONF_ACCESS_TOKEN,
    CONF_HUB_URL,
    DATA_CARD_RESOURCE_REGISTERED,
    DATA_COORDINATOR,
    DOMAIN,
    PLATFORMS,
)
from .coordinator import PrintStreamBridgeCoordinator


_LOGGER = logging.getLogger(__name__)

_RESOURCE_WAIT_SECONDS = 10
_RESOURCE_RETRY_INTERVAL_SECONDS = 5
_RESOURCE_RETRY_TIMEOUT_SECONDS = 120
_DATA_CARD_RESOURCE_RETRY_TASK = "card_resource_retry_task"
_DATA_SERVICES_REGISTERED = "services_registered"

SERVICE_PAUSE_PRINT = "pause_print"
SERVICE_RESUME_PRINT = "resume_print"
SERVICE_STOP_PRINT = "stop_print"
SERVICE_REFRESH_PRINTER = "refresh_printer"
SERVICE_REFRESH_AMS = "refresh_ams"
SERVICE_CLEAR_HMS_ERRORS = "clear_hms_errors"
SERVICE_SET_CHAMBER_LIGHT = "set_chamber_light"
SERVICE_RESCAN_AMS_SLOT = "rescan_ams_slot"

_SERVICE_FIELD_ENTITY_ID = "entity_id"
_SERVICE_FIELD_ON = "on"
_SERVICE_FIELD_CODE = "code"

_PRINTER_ENTITY_SERVICE_SCHEMA = vol.Schema({vol.Required(_SERVICE_FIELD_ENTITY_ID): cv.entity_id})
_AMS_ENTITY_SERVICE_SCHEMA = vol.Schema({vol.Required(_SERVICE_FIELD_ENTITY_ID): cv.entity_id})
_CHAMBER_LIGHT_SERVICE_SCHEMA = vol.Schema({
    vol.Required(_SERVICE_FIELD_ENTITY_ID): cv.entity_id,
    vol.Required(_SERVICE_FIELD_ON): cv.boolean,
})
_CLEAR_HMS_ERRORS_SCHEMA = vol.Schema({
    vol.Required(_SERVICE_FIELD_ENTITY_ID): cv.entity_id,
    vol.Optional(_SERVICE_FIELD_CODE): cv.string,
})


async def async_setup(hass: HomeAssistant, _config: dict) -> bool:
    """Set up the integration from YAML (not used)."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the PrintStream bridge from a config entry."""
    session = async_get_clientsession(hass)
    api = PrintStreamBridgeApiClient(entry.data[CONF_HUB_URL], session, entry.data.get(CONF_ACCESS_TOKEN))
    coordinator = PrintStreamBridgeCoordinator(hass, entry, api)
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {DATA_COORDINATOR: coordinator}

    await _async_migrate_external_spool_entities(hass, coordinator)
    await _async_migrate_entry_scoped_unique_ids(hass, entry)
    await _async_register_services(hass)
    await _async_register_card_resource(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    coordinator: PrintStreamBridgeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    coordinator.cancel_ws_task()
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return unloaded


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the config entry after updates."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_services(hass: HomeAssistant) -> None:
    """Register Home Assistant services for printer and AMS controls."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(_DATA_SERVICES_REGISTERED):
        return

    async def _async_handle_pause_print(call: ServiceCall) -> None:
        await _async_send_printer_command_for_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID], {"type": "pause"})

    async def _async_handle_resume_print(call: ServiceCall) -> None:
        await _async_send_printer_command_for_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID], {"type": "resume"})

    async def _async_handle_stop_print(call: ServiceCall) -> None:
        await _async_send_printer_command_for_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID], {"type": "stop"})

    async def _async_handle_refresh_printer(call: ServiceCall) -> None:
        await _async_send_printer_command_for_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID], {"type": "refresh"})

    async def _async_handle_refresh_ams(call: ServiceCall) -> None:
        await _async_send_printer_refresh_for_ams_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID])

    async def _async_handle_clear_hms_errors(call: ServiceCall) -> None:
        payload: dict[str, object] = {"type": "clearHmsErrors"}
        code = call.data.get(_SERVICE_FIELD_CODE)
        if isinstance(code, str) and code.strip():
            payload[_SERVICE_FIELD_CODE] = code.strip()
        await _async_send_printer_command_for_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID], payload)

    async def _async_handle_set_chamber_light(call: ServiceCall) -> None:
        await _async_send_printer_command_for_entity(
            hass,
            call.data[_SERVICE_FIELD_ENTITY_ID],
            {"type": "light", "node": "chamber", "on": call.data[_SERVICE_FIELD_ON]},
        )

    async def _async_handle_rescan_ams_slot(call: ServiceCall) -> None:
        slot_state = hass.states.get(call.data[_SERVICE_FIELD_ENTITY_ID])
        if slot_state is None:
            raise HomeAssistantError("AMS slot entity not found")

        attrs = slot_state.attributes
        if attrs.get("printstream_kind") != "ams_slot":
            raise HomeAssistantError("Service requires a PrintStream AMS slot entity")

        ams_unit_id = attrs.get("ams_unit_id")
        slot_number = attrs.get("slot")
        if not isinstance(ams_unit_id, int) or not isinstance(slot_number, int):
            raise HomeAssistantError("AMS slot entity is missing unit or slot metadata")

        printer_id = attrs.get("printer_id")
        if not isinstance(printer_id, str) or not printer_id:
            raise HomeAssistantError("AMS slot entity is missing printer metadata")

        client = _get_api_client_for_entity(hass, call.data[_SERVICE_FIELD_ENTITY_ID])
        try:
            await client.async_send_printer_command(
                printer_id,
                {"type": "rescanAmsSlot", "amsId": ams_unit_id, "slotId": slot_number - 1},
            )
        except PrintStreamBridgeApiError as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(DOMAIN, SERVICE_PAUSE_PRINT, _async_handle_pause_print, schema=_PRINTER_ENTITY_SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_RESUME_PRINT, _async_handle_resume_print, schema=_PRINTER_ENTITY_SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_STOP_PRINT, _async_handle_stop_print, schema=_PRINTER_ENTITY_SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_REFRESH_PRINTER, _async_handle_refresh_printer, schema=_PRINTER_ENTITY_SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_REFRESH_AMS, _async_handle_refresh_ams, schema=_AMS_ENTITY_SERVICE_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        SERVICE_CLEAR_HMS_ERRORS,
        _async_handle_clear_hms_errors,
        schema=_CLEAR_HMS_ERRORS_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_CHAMBER_LIGHT,
        _async_handle_set_chamber_light,
        schema=_CHAMBER_LIGHT_SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_RESCAN_AMS_SLOT,
        _async_handle_rescan_ams_slot,
        schema=_PRINTER_ENTITY_SERVICE_SCHEMA,
    )
    domain_data[_DATA_SERVICES_REGISTERED] = True


def _get_api_client_for_entity(hass: HomeAssistant, entity_id: str) -> PrintStreamBridgeApiClient:
    """Return the bridge API client backing a specific PrintStream entity."""
    domain_data = hass.data.get(DOMAIN, {})
    entity_entry = er.async_get(hass).async_get(entity_id)
    if entity_entry is not None:
        entry_data = domain_data.get(entity_entry.config_entry_id)
        coordinator = entry_data.get(DATA_COORDINATOR) if isinstance(entry_data, dict) else None
        if coordinator is not None:
            return coordinator.api

    if len(domain_data) == 1:
        only_entry = next(iter(domain_data.values()), None)
        coordinator = only_entry.get(DATA_COORDINATOR) if isinstance(only_entry, dict) else None
        if coordinator is not None:
            return coordinator.api

    raise HomeAssistantError("PrintStream bridge is not configured")


async def _async_send_printer_command_for_entity(
    hass: HomeAssistant,
    entity_id: str,
    command: dict[str, object],
) -> None:
    """Resolve a printer status entity to a printer id and send a command."""
    state = hass.states.get(entity_id)
    if state is None:
        raise HomeAssistantError("Printer entity not found")

    attrs = state.attributes
    if attrs.get("printstream_kind") != "printer":
        raise HomeAssistantError("Service requires a PrintStream printer status entity")

    printer_id = attrs.get("printer_id")
    if not isinstance(printer_id, str) or not printer_id:
        raise HomeAssistantError("Printer entity is missing bridge metadata")

    client = _get_api_client_for_entity(hass, entity_id)
    try:
        await client.async_send_printer_command(printer_id, command)
    except PrintStreamBridgeApiError as err:
        raise HomeAssistantError(str(err)) from err


async def _async_send_printer_refresh_for_ams_entity(hass: HomeAssistant, entity_id: str) -> None:
    """Resolve an AMS entity to its parent printer and request a refresh."""
    state = hass.states.get(entity_id)
    if state is None:
        raise HomeAssistantError("AMS entity not found")

    attrs = state.attributes
    if attrs.get("printstream_kind") != "ams":
        raise HomeAssistantError("Service requires a PrintStream AMS status entity")

    printer_id = attrs.get("printer_id")
    if not isinstance(printer_id, str) or not printer_id:
        raise HomeAssistantError("AMS entity is missing printer metadata")

    client = _get_api_client_for_entity(hass, entity_id)
    try:
        await client.async_send_printer_command(printer_id, {"type": "refresh"})
    except PrintStreamBridgeApiError as err:
        raise HomeAssistantError(str(err)) from err


async def _async_register_card_resource(hass: HomeAssistant) -> None:
    """Serve and register the bundled custom card resource once.

    Registers the JS as a Lovelace module resource so it appears in the
    card picker. Falls back to add_extra_js_url for YAML-mode installs.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(DATA_CARD_RESOURCE_REGISTERED):
        return
    # Claim the registration synchronously, before the first ``await``. With two
    # config entries (two bridges) Home Assistant runs their setups concurrently;
    # the static path route below can only be registered once, so a second entry
    # that observed the flag still unset would call async_register_static_paths a
    # second time and raise "Added route will never be executed, method GET is
    # already registered". Setting the flag here — while control has not yet
    # yielded to the event loop — closes that race so the loser skips instead.
    domain_data[DATA_CARD_RESOURCE_REGISTERED] = True

    resource_path = Path(__file__).parent / "frontend" / CARD_RESOURCE_FILENAME
    # Serve the exact JS file at the URL Lovelace loads. Home Assistant's
    # static path helper supports file paths here; custom integrations like
    # browser_mod use the same pattern.
    registered = False
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(f"/printstream/{CARD_RESOURCE_FILENAME}", str(resource_path), True)]
        )
        registered = True
    finally:
        if not registered:
            # Release the claim so a later setup retry can register the route.
            domain_data.pop(DATA_CARD_RESOURCE_REGISTERED, None)

    # Register as a Lovelace module resource so the card picker discovers it.
    # CARD_RESOURCE_URL carries a ?v= query string so each version gets a
    # fresh browser fetch. On upgrade we remove only previously registered
    # PrintStream card URLs before adding the current one.
    if not await _async_register_lovelace_resource(hass, _RESOURCE_WAIT_SECONDS):
        # YAML-mode fallback: inject via the legacy extra-JS mechanism.
        from homeassistant.components.frontend import add_extra_js_url  # noqa: PLC0415
        add_extra_js_url(hass, CARD_RESOURCE_URL)
        if not domain_data.get(_DATA_CARD_RESOURCE_RETRY_TASK):
            domain_data[_DATA_CARD_RESOURCE_RETRY_TASK] = hass.async_create_task(
                _async_retry_lovelace_resource_registration(hass)
            )


async def _async_retry_lovelace_resource_registration(hass: HomeAssistant) -> None:
    """Retry Lovelace resource registration until frontend storage is ready."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    deadline = asyncio.get_running_loop().time() + _RESOURCE_RETRY_TIMEOUT_SECONDS

    try:
        while asyncio.get_running_loop().time() < deadline:
            if await _async_register_lovelace_resource(hass, _RESOURCE_RETRY_INTERVAL_SECONDS):
                return
            await asyncio.sleep(_RESOURCE_RETRY_INTERVAL_SECONDS)
    finally:
        domain_data.pop(_DATA_CARD_RESOURCE_RETRY_TASK, None)


async def _async_register_lovelace_resource(hass: HomeAssistant, wait_seconds: int) -> bool:
    """Register the versioned Lovelace resource once the store is available."""
    deadline = asyncio.get_running_loop().time() + wait_seconds

    while True:
        lovelace_data = hass.data.get(LOVELACE_DATA)
        resources = (
            lovelace_data.resources
            if hasattr(lovelace_data, "resources")
            else lovelace_data.get("resources") if lovelace_data is not None else None
        )
        if resources is not None and hasattr(resources, "async_create_item"):
            if hasattr(resources, "async_get_info"):
                await resources.async_get_info()
            elif not resources.loaded:
                await resources.async_load()

            existing = resources.async_items() or []
            stale_ids = [
                item["id"]
                for item in existing
                if isinstance(item.get("url"), str)
                and "/printstream/printstream-cards.js" in item["url"]
                and item["url"] != CARD_RESOURCE_URL
            ]
            for stale_id in stale_ids:
                if hasattr(resources, "async_delete_item"):
                    await resources.async_delete_item(stale_id)

            if CARD_RESOURCE_URL not in {item["url"] for item in resources.async_items() or []}:
                await resources.async_create_item({"res_type": "module", "url": CARD_RESOURCE_URL})
            return True

        if asyncio.get_running_loop().time() >= deadline:
            return False
        await asyncio.sleep(0.5)


async def _async_migrate_external_spool_entities(
    hass: HomeAssistant,
    coordinator: PrintStreamBridgeCoordinator,
) -> None:
    """Rename stale single-spool sensor entries that were registered as spool 2.

    Some single-nozzle printers report their only manual spool as virtual tray
    ``254``. Older HA builds derived the entity name directly from that tray id,
    which permanently registered entries like ``external_spool_2`` in the entity
    registry. Migrate those entries in-place so single-spool printers expose the
    generic ``External Spool`` name and entity id.
    """
    registry = er.async_get(hass)

    for printer in coordinator.data.printers:
        serial = printer.get("serial") if isinstance(printer.get("serial"), str) else None
        external_spools = printer.get("externalSpools") if isinstance(printer.get("externalSpools"), list) else []
        if not serial or len(external_spools) != 1:
            continue

        spool = external_spools[0]
        if not isinstance(spool, dict) or spool.get("amsId") != 254:
            continue

        unique_id = f"printstream_{serial}_external_spool_254"
        entity_id = registry.async_get_entity_id("sensor", DOMAIN, unique_id)
        if entity_id is None:
            continue

        updates: dict[str, str] = {"original_name": "External Spool"}
        if entity_id.endswith("_external_spool_2"):
            updates["new_entity_id"] = entity_id.removesuffix("_2")

        try:
            registry.async_update_entity(entity_id, **updates)
        except ValueError as err:
            _LOGGER.warning("Could not migrate external spool entity %s: %s", entity_id, err)


async def _async_migrate_entry_scoped_unique_ids(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Prefix legacy entity unique IDs with the owning config entry id."""
    registry = er.async_get(hass)
    scoped_prefix = f"printstream_{entry.entry_id}_"

    for registry_entry in er.async_entries_for_config_entry(registry, entry.entry_id):
        unique_id = registry_entry.unique_id
        if not unique_id.startswith("printstream_") or unique_id.startswith(scoped_prefix):
            continue

        new_unique_id = unique_id.replace("printstream_", scoped_prefix, 1)

        try:
            registry.async_update_entity(registry_entry.entity_id, new_unique_id=new_unique_id)
        except ValueError as err:
            _LOGGER.warning(
                "Could not migrate PrintStream entity %s from %s to %s: %s",
                registry_entry.entity_id,
                unique_id,
                new_unique_id,
                err,
            )
