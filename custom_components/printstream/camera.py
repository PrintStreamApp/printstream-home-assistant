"""Camera entities for PrintStream printers.

Exposes the live chamber camera as a Home Assistant camera entity. The
PrintStream API proxies the printer's proprietary/RTSP transport into a
single multipart/x-mixed-replace MJPEG stream at ``cameraStreamPath`` and a
single JPEG at ``cameraSnapshotPath``; this entity forwards both to Home
Assistant so the live feed is available alongside the snapshot image entity.
"""
from __future__ import annotations

import logging
from typing import Any

from aiohttp import web
from homeassistant.components.camera import Camera
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_aiohttp_proxy_web
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import PrintStreamBridgeApiError, build_url
from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import PrintStreamBridgeCoordinator
from .entity import PrintStreamPrinterEntity, printer_unique_id


_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up camera entities from a config entry."""
    coordinator: PrintStreamBridgeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    known_entities: set[str] = set()

    @callback
    def _async_sync_entities() -> None:
        new_entities: list[Camera] = []

        for printer in coordinator.data.printers:
            printer_id = printer.get("id")
            if not isinstance(printer_id, str):
                continue
            if printer.get("cameraSupported") is not True:
                continue

            key = f"printer:{printer_id}:camera"
            if key in known_entities:
                continue
            known_entities.add(key)
            new_entities.append(PrintStreamPrinterCameraEntity(coordinator, entry, printer_id))

        if new_entities:
            async_add_entities(new_entities)

    _async_sync_entities()
    entry.async_on_unload(coordinator.async_add_listener(_async_sync_entities))


class PrintStreamPrinterCameraEntity(Camera, PrintStreamPrinterEntity):
    """Live chamber camera backed by the PrintStream MJPEG proxy."""

    _attr_name = "Camera"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        Camera.__init__(self)
        PrintStreamPrinterEntity.__init__(self, coordinator, entry, printer_id)
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, "camera")

    @property
    def available(self) -> bool:
        return self.printer is not None and self._stream_path is not None

    @property
    def _stream_path(self) -> str | None:
        return _string_path((self.printer or {}).get("cameraStreamPath"))

    @property
    def _snapshot_path(self) -> str | None:
        return _string_path((self.printer or {}).get("cameraSnapshotPath"))

    async def async_camera_image(self, width: int | None = None, height: int | None = None) -> bytes | None:
        snapshot_path = self._snapshot_path
        if not snapshot_path:
            return None
        try:
            return await self.coordinator.api.async_get_bytes(snapshot_path)
        except PrintStreamBridgeApiError as err:
            _LOGGER.debug("PrintStream camera snapshot failed for %s: %s", self.entity_id, err)
            return None

    async def handle_async_mjpeg_stream(self, request: web.Request) -> web.StreamResponse | None:
        stream_path = self._stream_path
        if not stream_path:
            return None

        api = self.coordinator.api
        url = build_url(api.base_url, stream_path)
        stream_coro = api.session.get(url, headers=api.auth_headers or None)
        return await async_aiohttp_proxy_web(self.hass, request, stream_coro)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        printer = self.printer
        if not printer:
            return None
        return {
            "printstream_kind": "printer_camera",
            "printer_id": printer.get("id"),
            "printer_name": printer.get("name"),
            "printer_serial": printer.get("serial"),
            "job_name": printer.get("jobName"),
            "last_job_name": printer.get("lastJobName"),
        }


def _string_path(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None
