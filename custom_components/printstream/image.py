"""Image entities for PrintStream printers."""
from __future__ import annotations

from datetime import datetime
import logging
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from homeassistant.components.image import ImageEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .api import PrintStreamBridgeApiError
from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import PrintStreamBridgeCoordinator
from .entity import PrintStreamPrinterEntity, printer_unique_id


_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up image entities from a config entry."""
    coordinator: PrintStreamBridgeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    known_entities: set[str] = set()

    @callback
    def _async_sync_entities() -> None:
        new_entities: list[ImageEntity] = []

        for printer in coordinator.data.printers:
            printer_id = printer.get("id")
            if not isinstance(printer_id, str):
                continue

            image_entities: list[tuple[str, ImageEntity]] = [
                ("cover_image", PrintStreamPrinterCoverImageEntity(coordinator, entry, printer_id)),
            ]
            if printer.get("cameraSupported") is True:
                image_entities.append(("camera_snapshot", PrintStreamPrinterCameraImageEntity(coordinator, entry, printer_id)))

            for suffix, entity in image_entities:
                key = f"printer:{printer_id}:{suffix}"
                if key in known_entities:
                    continue
                known_entities.add(key)
                new_entities.append(entity)

        if new_entities:
            async_add_entities(new_entities)

    _async_sync_entities()
    entry.async_on_unload(coordinator.async_add_listener(_async_sync_entities))


class PrintStreamPrinterImageEntity(ImageEntity, PrintStreamPrinterEntity):
    """Base class for printer-backed image entities."""

    _attr_should_poll = False
    _printstream_image_kind = "image"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        ImageEntity.__init__(self, coordinator.hass)
        PrintStreamPrinterEntity.__init__(self, coordinator, entry, printer_id)
        self._image_path: str | None = None
        self._async_update_image_state()

    @property
    def available(self) -> bool:
        return self.printer is not None and self._image_path is not None

    @callback
    def _handle_coordinator_update(self) -> None:
        previous_path = self._image_path
        previous_updated_at = self._attr_image_last_updated

        self._async_update_image_state()

        if self._image_path != previous_path or self._attr_image_last_updated != previous_updated_at:
            self._cached_image = None

        super()._handle_coordinator_update()

    @callback
    def _async_update_image_state(self) -> None:
        self._image_path = self._resolved_image_path
        self._attr_image_url = None

        observed = (self.printer or {}).get("observedAt")
        self._attr_image_last_updated = dt_util.parse_datetime(observed) if isinstance(observed, str) else None

    async def async_image(self) -> bytes | None:
        if not self._image_path:
            return None

        try:
            return await self.coordinator.api.async_get_bytes(self._image_path)
        except PrintStreamBridgeApiError as err:
            _LOGGER.debug("PrintStream image fetch failed for %s: %s", self.entity_id, err)
            return None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        printer = self.printer
        if not printer:
            return None
        return {
            "printstream_kind": "printer_image",
            "printstream_image_kind": self._printstream_image_kind,
            "printer_id": printer.get("id"),
            "printer_name": printer.get("name"),
            "printer_serial": printer.get("serial"),
            "job_name": printer.get("jobName"),
            "last_job_name": printer.get("lastJobName"),
        }


class PrintStreamPrinterCoverImageEntity(PrintStreamPrinterImageEntity):
    """Current or last-job cover image."""

    _attr_name = "Cover Image"
    _attr_content_type = "image/png"
    _printstream_image_kind = "cover"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, "cover_image")

    @property
    def _resolved_image_path(self) -> str | None:
        printer = self.printer or {}
        return _string_path(printer.get("coverImagePath"))


class PrintStreamPrinterCameraImageEntity(PrintStreamPrinterImageEntity):
    """Single-frame camera snapshot image."""

    _attr_name = "Camera Snapshot"
    _attr_content_type = "image/jpeg"
    _printstream_image_kind = "camera"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, "camera_snapshot")

    @property
    def _resolved_image_path(self) -> str | None:
        return _string_path((self.printer or {}).get("cameraSnapshotPath"))


def _string_path(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _append_cache_buster(url: str, printer: dict[str, Any]) -> str:
    observed_at = printer.get("observedAt")
    if not isinstance(observed_at, str) or not observed_at:
        return url

    parts = urlsplit(url)
    separator = "&" if parts.query else "?"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, f"{parts.query}{separator if parts.query else ''}t={observed_at}", parts.fragment))