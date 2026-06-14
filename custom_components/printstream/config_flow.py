"""Config flow for the PrintStream bridge integration."""
from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import PrintStreamBridgeApiClient, PrintStreamBridgeApiError, normalize_base_url
from .const import (
    CONF_ACCESS_TOKEN,
    DEFAULT_HUB_URL,
    CONF_HUB_URL,
    DEFAULT_NAME,
    DOMAIN,
    NAME,
)


def _build_schema(
    user_input: dict | None = None,
    *,
    include_access_token_default: bool = True,
    require_access_token: bool = False,
) -> vol.Schema:
    """Build the user-step form schema."""
    defaults = user_input or {}
    access_token_marker = vol.Required if require_access_token else vol.Optional
    return vol.Schema(
        {
            vol.Required("name", default=defaults.get("name", DEFAULT_NAME)): str,
            vol.Required(
                CONF_HUB_URL,
                default=defaults.get(CONF_HUB_URL, DEFAULT_HUB_URL),
            ): str,
            access_token_marker(
                CONF_ACCESS_TOKEN,
                default=defaults.get(CONF_ACCESS_TOKEN, "") if include_access_token_default else "",
            ): str,
        }
    )


def _normalize_entry_data(
    user_input: dict,
    *,
    existing_data: dict | None = None,
    preserve_existing_token: bool = False,
) -> tuple[dict[str, str], str | None]:
    """Normalize config flow input into stored entry data."""
    name = str(user_input.get("name") or DEFAULT_NAME).strip() or DEFAULT_NAME
    hub_url = normalize_base_url(str(user_input[CONF_HUB_URL]))
    access_token = str(user_input.get(CONF_ACCESS_TOKEN) or "").strip() or None

    entry_data = {
        "name": name,
        CONF_HUB_URL: hub_url,
    }
    if access_token is not None:
        entry_data[CONF_ACCESS_TOKEN] = access_token
    elif preserve_existing_token and existing_data and existing_data.get(CONF_ACCESS_TOKEN):
        entry_data[CONF_ACCESS_TOKEN] = str(existing_data[CONF_ACCESS_TOKEN])

    return entry_data, access_token


async def _async_validate_connection(hass: HomeAssistant, hub_url: str, access_token: str | None) -> None:
    """Check that the PrintStream bridge endpoint is reachable."""
    session = async_get_clientsession(hass)
    client = PrintStreamBridgeApiClient(hub_url, session, access_token)
    await client.async_get_snapshot()


class PrintStreamConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for the PrintStream bridge."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry) -> "PrintStreamOptionsFlow":
        """Return the options flow for an existing entry."""
        return PrintStreamOptionsFlow(config_entry)

    async def async_step_user(self, user_input: dict | None = None):
        """Handle the initial user step."""
        errors: dict[str, str] = {}
        normalized_input = dict(user_input or {})

        if user_input is not None:
            entry_data, access_token = _normalize_entry_data(user_input)
            normalized_input.update(entry_data)
            if access_token is None:
                errors[CONF_ACCESS_TOKEN] = "required"
            else:
                try:
                    await _async_validate_connection(self.hass, entry_data[CONF_HUB_URL], access_token)
                except PrintStreamBridgeApiError:
                    errors["base"] = "cannot_connect"
                else:
                    return self.async_create_entry(
                        title=entry_data["name"] or NAME,
                        data=entry_data,
                    )

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(normalized_input, require_access_token=True),
            errors=errors,
        )


class PrintStreamOptionsFlow(config_entries.OptionsFlow):
    """Reconfigure an existing PrintStream bridge entry."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self.config_entry = config_entry

    async def async_step_init(self, user_input: dict | None = None):
        """Handle updates to the configured base URL or access token."""
        errors: dict[str, str] = {}
        normalized_input = {
            "name": self.config_entry.data.get("name", self.config_entry.title or DEFAULT_NAME),
            CONF_HUB_URL: self.config_entry.data.get(CONF_HUB_URL, DEFAULT_HUB_URL),
        }

        if user_input is not None:
            entry_data, access_token = _normalize_entry_data(
                user_input,
                existing_data=dict(self.config_entry.data),
                preserve_existing_token=True,
            )
            normalized_input.update({
                "name": entry_data["name"],
                CONF_HUB_URL: entry_data[CONF_HUB_URL],
            })
            effective_token = access_token
            if effective_token is None and self.config_entry.data.get(CONF_ACCESS_TOKEN):
                effective_token = str(self.config_entry.data[CONF_ACCESS_TOKEN])
            try:
                await _async_validate_connection(self.hass, entry_data[CONF_HUB_URL], effective_token)
            except PrintStreamBridgeApiError:
                errors["base"] = "cannot_connect"
            else:
                self.hass.config_entries.async_update_entry(
                    self.config_entry,
                    title=entry_data["name"] or NAME,
                    data=entry_data,
                )
                return self.async_create_entry(title="", data={})

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(normalized_input, include_access_token_default=False),
            errors=errors,
        )
