"""Config flow for the PrintStream integration.

Three ways in: the initial setup (``user``); re-authentication (``reauth``), which Home
Assistant starts when PrintStream rejects the stored access token; and ``reconfigure``,
which changes the name, URL or token of an existing entry. Each one checks the connection
before saving, and a rejected token is reported as ``invalid_auth`` rather than as an
unreachable server.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import voluptuous as vol

from .api import (
    PrintStreamAuthError,
    PrintStreamBridgeApiClient,
    PrintStreamBridgeApiError,
    normalize_access_token,
    normalize_base_url,
)
from .const import (
    CONF_ACCESS_TOKEN,
    CONF_HUB_URL,
    DEFAULT_HUB_URL,
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
                default=defaults.get(CONF_ACCESS_TOKEN, "")
                if include_access_token_default
                else "",
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
    elif (
        preserve_existing_token
        and existing_data
        and existing_data.get(CONF_ACCESS_TOKEN)
    ):
        entry_data[CONF_ACCESS_TOKEN] = str(existing_data[CONF_ACCESS_TOKEN])

    return entry_data, access_token


async def _async_validate_connection(
    hass: HomeAssistant, hub_url: str, access_token: str | None
) -> None:
    """Check that PrintStream answers the snapshot endpoint with this URL and token.

    Raises PrintStreamAuthError for a rejected token and PrintStreamBridgeApiError when the
    server cannot be reached or answers badly.
    """
    session = async_get_clientsession(hass)
    client = PrintStreamBridgeApiClient(hub_url, session, access_token)
    await client.async_get_snapshot()


async def _async_connection_error(
    hass: HomeAssistant, hub_url: str, access_token: str | None
) -> str | None:
    """Validate the connection and return the form error key, or None when it works."""
    try:
        await _async_validate_connection(hass, hub_url, access_token)
    except PrintStreamAuthError:
        return "invalid_auth"
    except PrintStreamBridgeApiError:
        return "cannot_connect"
    return None


class PrintStreamConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle setup, re-authentication and reconfiguration of a PrintStream entry."""

    # The stored entry data has kept one shape (name, hub_url, access_token) since the
    # first release, so there is no migration. Bump this, and add async_migrate_entry in
    # __init__.py, only when that shape changes.
    VERSION = 1

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
                error = await _async_connection_error(
                    self.hass, entry_data[CONF_HUB_URL], access_token
                )
                if error:
                    errors["base"] = error
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

    async def async_step_reauth(self, entry_data: Mapping[str, Any]):
        """Start re-authentication after PrintStream rejected the stored token."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict | None = None):
        """Ask for a new access token and save it once PrintStream accepts it."""
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}

        if user_input is not None:
            access_token = normalize_access_token(user_input.get(CONF_ACCESS_TOKEN))
            if access_token is None:
                errors[CONF_ACCESS_TOKEN] = "required"
            else:
                error = await _async_connection_error(
                    self.hass, entry.data[CONF_HUB_URL], access_token
                )
                if error:
                    errors["base"] = error
                else:
                    return self.async_update_reload_and_abort(
                        entry,
                        data={**entry.data, CONF_ACCESS_TOKEN: access_token},
                        reason="reauth_successful",
                    )

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({vol.Required(CONF_ACCESS_TOKEN): str}),
            description_placeholders={"name": entry.title},
            errors=errors,
        )

    async def async_step_reconfigure(self, user_input: dict | None = None):
        """Change the name, URL or access token of an existing entry.

        A blank token keeps the stored one, so changing only the URL does not mean
        creating a new token.
        """
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        normalized_input = {
            "name": entry.data.get("name", entry.title or DEFAULT_NAME),
            CONF_HUB_URL: entry.data.get(CONF_HUB_URL, DEFAULT_HUB_URL),
        }

        if user_input is not None:
            entry_data, _ = _normalize_entry_data(
                user_input,
                existing_data=dict(entry.data),
                preserve_existing_token=True,
            )
            normalized_input.update(
                {"name": entry_data["name"], CONF_HUB_URL: entry_data[CONF_HUB_URL]}
            )
            error = await _async_connection_error(
                self.hass, entry_data[CONF_HUB_URL], entry_data.get(CONF_ACCESS_TOKEN)
            )
            if error:
                errors["base"] = error
            else:
                return self.async_update_reload_and_abort(
                    entry,
                    title=entry_data["name"] or NAME,
                    data=entry_data,
                    reason="reconfigure_successful",
                )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_build_schema(
                normalized_input, include_access_token_default=False
            ),
            errors=errors,
        )
