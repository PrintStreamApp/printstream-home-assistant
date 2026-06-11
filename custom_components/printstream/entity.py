"""Shared entity helpers for PrintStream bridge devices."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from typing import Any

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .api import build_url
from .const import CONF_HUB_URL, DOMAIN, MANUFACTURER
from .coordinator import PrintStreamBridgeCoordinator


_CHAMBER_TEMPERATURE_MODELS = {"X1E", "H2D", "H2DPRO", "H2C", "H2S"}
_AUX_FAN_MODELS = {"X1C", "X1E", "X2D", "P1S", "P2S", "H2D", "H2DPRO", "H2C", "H2S"}
_CHAMBER_FAN_MODELS = {"X1C", "X1E", "X2D", "P1S", "P2S", "H2D", "H2DPRO", "H2C", "H2S"}
_DOOR_SENSOR_MODELS = {"X1C", "X1E", "X2D", "P2S", "H2D", "H2DPRO", "H2C", "H2S"}
_AIRDUCT_MODELS = {"X2D", "P2S", "H2D", "H2DPRO", "H2C", "H2S"}
_DUAL_NOZZLE_MODELS = {"X2D", "H2D", "H2DPRO", "H2C"}


class PrintStreamPrinterEntity(CoordinatorEntity[PrintStreamBridgeCoordinator]):
    """Base class for printer-backed entities."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        super().__init__(coordinator)
        self._entry = entry
        self._printer_id = printer_id

    @property
    def printer(self) -> dict[str, Any] | None:
        """Return the current printer snapshot."""
        return self.coordinator.get_printer(self._printer_id)

    @property
    def available(self) -> bool:
        """Mark entities unavailable when the printer disappears from the bridge."""
        return self.printer is not None

    @property
    def device_info(self) -> DeviceInfo:
        """Describe the printer device."""
        printer = self.printer or {}
        serial = _string_value(printer.get("serial")) or self._printer_id
        detail_path = _string_value(printer.get("detailPath"))

        return DeviceInfo(
            identifiers={(DOMAIN, printer_device_identifier(self._entry, serial))},
            manufacturer=MANUFACTURER,
            name=_string_value(printer.get("name")) or serial,
            model=_string_value(printer.get("model")),
            serial_number=serial,
            configuration_url=build_url(self._entry.data[CONF_HUB_URL], detail_path) if detail_path else None,
        )


class PrintStreamAmsEntity(CoordinatorEntity[PrintStreamBridgeCoordinator]):
    """Base class for AMS-backed entities."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str) -> None:
        super().__init__(coordinator)
        self._entry = entry
        self._ams_id = ams_id

    @property
    def ams(self) -> dict[str, Any] | None:
        """Return the current AMS snapshot."""
        return self.coordinator.get_ams(self._ams_id)

    @property
    def available(self) -> bool:
        """Mark entities unavailable when the AMS disappears from the bridge."""
        return self.ams is not None

    @property
    def device_info(self) -> DeviceInfo:
        """Describe the AMS device."""
        ams = self.ams or {}
        printer_serial = _string_value(ams.get("printerSerial")) or "unknown"
        unit_id = ams.get("unitId")
        detail_path = f"/printers/{ams.get('printerId')}" if isinstance(ams.get("printerId"), str) else None

        return DeviceInfo(
            identifiers={(DOMAIN, ams_device_identifier(self._entry, printer_serial, unit_id))},
            manufacturer=MANUFACTURER,
            name=_ams_display_name(ams, unit_id),
            model="AMS",
            via_device=(DOMAIN, printer_device_identifier(self._entry, printer_serial)),
            configuration_url=build_url(self._entry.data[CONF_HUB_URL], detail_path) if detail_path else None,
        )


def printer_unique_id(entry: ConfigEntry, printer: dict[str, Any] | None, fallback_printer_id: str, suffix: str) -> str:
    serial = _string_value((printer or {}).get("serial")) or fallback_printer_id
    return f"printstream_{entry.entry_id}_{serial}_{suffix}"


def ams_unique_id(entry: ConfigEntry, ams: dict[str, Any] | None, fallback_ams_id: str, suffix: str) -> str:
    printer_serial = _string_value((ams or {}).get("printerSerial")) or "unknown"
    unit_id = (ams or {}).get("unitId")
    unit_token = unit_id if unit_id is not None else fallback_ams_id
    return f"printstream_{entry.entry_id}_{printer_serial}_ams_{unit_token}_{suffix}"


def printer_device_identifier(entry: ConfigEntry, serial: str) -> str:
    return f"printer:{entry.entry_id}:{serial}"


def ams_device_identifier(entry: ConfigEntry, printer_serial: str, unit_id: Any) -> str:
    return f"ams:{entry.entry_id}:{printer_serial}:{unit_id}"


def _ams_display_name(ams: dict[str, Any], unit_id: Any) -> str:
    printer_name = _string_value(ams.get("printerName"))
    configured_name = _string_value(ams.get("name"))
    fallback = f"AMS {unit_id + 1}" if isinstance(unit_id, int) else "AMS"
    base = configured_name or fallback
    if printer_name and not base.startswith(printer_name):
        return f"{printer_name} {base}"
    return base


def printer_model(printer: dict[str, Any] | None) -> str | None:
    return _string_value((printer or {}).get("model"))


def printer_supports_chamber_temperature(printer: dict[str, Any] | None) -> bool:
    return printer_model(printer) in _CHAMBER_TEMPERATURE_MODELS


def printer_supports_aux_fan(printer: dict[str, Any] | None) -> bool:
    return printer_model(printer) in _AUX_FAN_MODELS


def printer_supports_chamber_fan(printer: dict[str, Any] | None) -> bool:
    return printer_model(printer) in _CHAMBER_FAN_MODELS


def printer_supports_door_sensor(printer: dict[str, Any] | None) -> bool:
    return printer_model(printer) in _DOOR_SENSOR_MODELS


def printer_supports_airduct_mode(printer: dict[str, Any] | None) -> bool:
    return printer_model(printer) in _AIRDUCT_MODELS


def printer_supports_dual_nozzles(printer: dict[str, Any] | None) -> bool:
    return printer_model(printer) in _DUAL_NOZZLE_MODELS


def printer_has_light_node(printer: dict[str, Any] | None, node: str) -> bool:
    light_capabilities = (printer or {}).get("lightCapabilities")
    if not isinstance(light_capabilities, dict):
        return False
    return bool(light_capabilities.get(node))


def printer_has_any_light(printer: dict[str, Any] | None) -> bool:
    light_capabilities = (printer or {}).get("lightCapabilities")
    if not isinstance(light_capabilities, dict):
        return False
    return any(bool(value) for value in light_capabilities.values())


def printer_print_option_supported(printer: dict[str, Any] | None, option_key: str) -> bool:
    print_options = (printer or {}).get("printOptions")
    if not isinstance(print_options, dict):
        return False
    option = print_options.get(option_key)
    return isinstance(option, dict) and bool(option.get("supported"))


def printer_ams_setting_available(printer: dict[str, Any] | None, setting_key: str) -> bool:
    ams_settings = (printer or {}).get("amsSettings")
    if not isinstance(ams_settings, dict):
        return False
    return setting_key in ams_settings and ams_settings.get(setting_key) is not None


def printer_nozzles(printer: dict[str, Any] | None) -> list[dict[str, Any]]:
    nozzles = (printer or {}).get("nozzles")
    if not isinstance(nozzles, list):
        return []
    return [entry for entry in nozzles if isinstance(entry, dict)]


def printer_external_spools(printer: dict[str, Any] | None) -> list[dict[str, Any]]:
    spools = (printer or {}).get("externalSpools")
    if not isinstance(spools, list):
        return []
    return [entry for entry in spools if isinstance(entry, dict)]


def ams_slots(ams: dict[str, Any] | None) -> list[dict[str, Any]]:
    slots = (ams or {}).get("slots")
    if not isinstance(slots, list):
        return []
    return [entry for entry in slots if isinstance(entry, dict)]


def _string_value(value: Any) -> str | None:
    """Return a stripped string value when possible."""
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None
