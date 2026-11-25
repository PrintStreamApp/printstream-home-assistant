"""WebSocket-driven coordinator for the PrintStream bridge.

Fetches the full snapshot once on start-up (so entities can be registered),
then opens a persistent WebSocket connection to ``/ws`` and applies incremental
``plugin.event`` updates pushed by the PrintStream API in real time.

The coordinator also refetches the full snapshot every time the WebSocket
connects so reconnects can recover from missed push events and stale state.

A rejected access token (HTTP 401 or 403, on the snapshot or the WebSocket
handshake) is not retried: it raises ConfigEntryAuthFailed or starts the
entry's re-authentication flow, so the user is asked for a new token.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
import json
import logging
from typing import Any

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import (
    AUTH_FAILURE_STATUSES,
    PrintStreamAuthError,
    PrintStreamBridgeApiClient,
    PrintStreamBridgeApiError,
    build_ws_url,
)
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
_RECONNECT_DELAY_SECONDS = 5
_HA_PLUGIN_NAME = "home-assistant"


def is_auth_failure_status(status: int | None) -> bool:
    """Whether an HTTP status means PrintStream rejected the access token."""
    return status in AUTH_FAILURE_STATUSES


@dataclass(slots=True)
class PrintStreamBridgeData:
    """Indexed bridge snapshot used by the entities."""

    generated_at: str | None
    printers: list[dict[str, Any]]
    printers_by_id: dict[str, dict[str, Any]]
    ams_by_id: dict[str, dict[str, Any]]


def _parse_snapshot(payload: dict[str, Any]) -> PrintStreamBridgeData:
    """Index a raw snapshot payload into the coordinator data structure."""
    printers = [p for p in payload.get("printers", []) if isinstance(p, dict)]
    printers_by_id: dict[str, dict[str, Any]] = {}
    ams_by_id: dict[str, dict[str, Any]] = {}

    for printer in printers:
        printer_id = printer.get("id")
        if isinstance(printer_id, str):
            printers_by_id[printer_id] = printer
        for ams in printer.get("ams", []):
            if not isinstance(ams, dict):
                continue
            ams_id = ams.get("id")
            if isinstance(ams_id, str):
                ams_by_id[ams_id] = ams

    return PrintStreamBridgeData(
        generated_at=payload.get("generatedAt")
        if isinstance(payload.get("generatedAt"), str)
        else None,
        printers=printers,
        printers_by_id=printers_by_id,
        ams_by_id=ams_by_id,
    )


class PrintStreamBridgeCoordinator(DataUpdateCoordinator[PrintStreamBridgeData]):
    """Coordinator driven by WebSocket push events from PrintStream.

    The polling interval is intentionally left unset (``None``); the only
    scheduled fetch is the initial one called by
    ``async_config_entry_first_refresh``. All subsequent updates arrive via
    the WebSocket listener task started in that same call, with a full snapshot
    resync whenever the WebSocket reconnects.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        api: PrintStreamBridgeApiClient,
    ) -> None:
        super().__init__(hass, _LOGGER, name=DOMAIN, config_entry=entry)
        self.api = api
        self._ws_task: asyncio.Task | None = None

    # ------------------------------------------------------------------
    # DataUpdateCoordinator overrides
    # ------------------------------------------------------------------

    async def _async_update_data(self) -> PrintStreamBridgeData:
        """Fetch the full snapshot (called once on start-up)."""
        try:
            payload = await self.api.async_get_snapshot()
        except PrintStreamAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except PrintStreamBridgeApiError as err:
            raise UpdateFailed(str(err)) from err
        return _parse_snapshot(payload)

    async def async_config_entry_first_refresh(self) -> None:
        """Fetch initial data then start the WebSocket listener."""
        await super().async_config_entry_first_refresh()
        self._ws_task = self.hass.async_create_background_task(
            self._ws_listener(),
            name=f"{DOMAIN}_ws_listener",
        )

    # ------------------------------------------------------------------
    # Public helpers used by entity modules
    # ------------------------------------------------------------------

    def get_printer(self, printer_id: str) -> dict[str, Any] | None:
        """Return the current snapshot for a printer, or ``None``."""
        return self.data.printers_by_id.get(printer_id) if self.data else None

    def get_ams(self, ams_id: str) -> dict[str, Any] | None:
        """Return the current snapshot for an AMS unit, or ``None``."""
        return self.data.ams_by_id.get(ams_id) if self.data else None

    @property
    def live_updates_running(self) -> bool:
        """Whether the WebSocket listener is still running (for diagnostics)."""
        return self._ws_task is not None and not self._ws_task.done()

    def cancel_ws_task(self) -> None:
        """Cancel the background WebSocket listener (called on entry unload)."""
        if self._ws_task is not None:
            self._ws_task.cancel()

    # ------------------------------------------------------------------
    # Internal WebSocket listener
    # ------------------------------------------------------------------

    async def _ws_listener(self) -> None:
        """Maintain a persistent WebSocket connection to PrintStream."""
        ws_url = build_ws_url(self.api.base_url)
        while True:
            try:
                _LOGGER.debug("PrintStream WS: connecting to %s", ws_url)
                async with self.api.session.ws_connect(
                    ws_url,
                    heartbeat=30,
                    headers=self.api.auth_headers or None,
                ) as ws:
                    _LOGGER.info("PrintStream WS: connected")
                    if not await self._async_refresh_snapshot_from_bridge():
                        return
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            self._handle_ws_message(msg.data)
                        elif msg.type in (
                            aiohttp.WSMsgType.CLOSED,
                            aiohttp.WSMsgType.ERROR,
                        ):
                            _LOGGER.warning(
                                "PrintStream WS: connection closed (%s)", msg.type
                            )
                            break
            except asyncio.CancelledError:
                _LOGGER.debug("PrintStream WS: listener cancelled")
                return
            except aiohttp.WSServerHandshakeError as err:
                if is_auth_failure_status(err.status):
                    self._start_reauth("WebSocket handshake")
                    return
                _LOGGER.warning(
                    "PrintStream WS: handshake failed (HTTP %s); reconnecting in %ds",
                    err.status,
                    _RECONNECT_DELAY_SECONDS,
                )
            except Exception:
                _LOGGER.exception(
                    "PrintStream WS: unexpected error; reconnecting in %ds",
                    _RECONNECT_DELAY_SECONDS,
                )
            await asyncio.sleep(_RECONNECT_DELAY_SECONDS)

    async def _async_refresh_snapshot_from_bridge(self) -> bool:
        """Refresh the full bridge snapshot after a WS connect or reconnect.

        Returns False when the token was rejected and re-authentication has started, so
        the listener stops instead of reconnecting with a token that cannot work.
        """
        try:
            payload = await self.api.async_get_snapshot()
        except PrintStreamAuthError:
            self._start_reauth("snapshot refresh")
            return False
        except PrintStreamBridgeApiError:
            _LOGGER.exception("PrintStream WS: snapshot refresh failed after connect")
            return True

        self.async_set_updated_data(_parse_snapshot(payload))
        return True

    def _start_reauth(self, where: str) -> None:
        """Ask the user for a new access token; the reloaded entry restarts the listener."""
        _LOGGER.warning(
            "PrintStream rejected the access token during %s; re-authentication needed",
            where,
        )
        self.config_entry.async_start_reauth(self.hass)

    def _handle_ws_message(self, raw: str) -> None:
        """Parse a raw WS text frame and apply state updates."""
        try:
            event = json.loads(raw)
        except json.JSONDecodeError:
            return

        if (
            event.get("type") != "plugin.event"
            or event.get("pluginName") != _HA_PLUGIN_NAME
        ):
            return

        inner = event.get("event")
        if not isinstance(inner, dict):
            return

        kind = inner.get("type")

        if kind == "printer.update":
            self._apply_printer_update(inner.get("printer"))
        elif kind == "snapshot":
            new_data = _parse_snapshot(inner)
            self.async_set_updated_data(new_data)

    def _apply_printer_update(self, printer_data: Any) -> None:
        """Merge a single-printer update into the current data."""
        if not isinstance(printer_data, dict) or self.data is None:
            return

        printer_id = printer_data.get("id")
        if not isinstance(printer_id, str):
            return

        printers_by_id = {**self.data.printers_by_id, printer_id: printer_data}
        ams_by_id = dict(self.data.ams_by_id)

        for ams in printer_data.get("ams", []):
            if isinstance(ams, dict):
                ams_id = ams.get("id")
                if isinstance(ams_id, str):
                    ams_by_id[ams_id] = ams

        self.async_set_updated_data(
            PrintStreamBridgeData(
                generated_at=self.data.generated_at,
                printers=list(printers_by_id.values()),
                printers_by_id=printers_by_id,
                ams_by_id=ams_by_id,
            )
        )
