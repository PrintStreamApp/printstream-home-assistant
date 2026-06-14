"""Media source support for browsing the PrintStream library."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

from homeassistant.components.media_source.models import BrowseMediaSource, MediaSource, MediaSourceItem, PlayMedia
try:
    from homeassistant.components.media_player import BrowseError
except ImportError:  # pragma: no cover - compatibility for alternate HA layouts
    from homeassistant.components.media_source.models import BrowseError
from homeassistant.core import HomeAssistant

from .api import PrintStreamBridgeApiClient, PrintStreamBridgeApiError, build_url
from .const import DATA_COORDINATOR, DOMAIN


MEDIA_TYPE_FILE = "file"
MEDIA_TYPE_FOLDER = "folder"
MEDIA_TYPE_ENTRY = "entry"


async def async_get_media_source(hass: HomeAssistant) -> MediaSource:
    """Return the PrintStream library media source."""
    return PrintStreamLibraryMediaSource(hass)


@dataclass(slots=True)
class _LibraryBrowseResult:
    folders: list[dict[str, Any]]
    files: list[dict[str, Any]]


class PrintStreamLibraryMediaSource(MediaSource):
    """Browse the PrintStream library through Home Assistant's media picker."""

    name = "PrintStream Library"

    async def async_resolve_media(self, item: MediaSourceItem) -> PlayMedia:
        if item.identifier is None:
            raise BrowseError("Select a library file")
        entry_id, kind, value = _parse_identifier(item.identifier)
        api = _get_api_client(self.hass, entry_id)
        if kind != MEDIA_TYPE_FILE:
            raise BrowseError("Folders cannot be played")
        return PlayMedia(
            url=build_url(api.base_url, f"/api/library/{value}/download"),
            mime_type="application/octet-stream",
        )

    async def async_browse_media(self, item: MediaSourceItem) -> BrowseMediaSource:
        entry_id, kind, value = _parse_identifier(item.identifier)
        if entry_id is None and _has_multiple_entries(self.hass):
            return BrowseMediaSource(
                domain=DOMAIN,
                identifier=item.identifier or "",
                media_class="directory",
                media_content_type=MEDIA_TYPE_FOLDER,
                title=self.name,
                can_play=False,
                can_expand=True,
                children=_entry_children(self.hass),
                children_media_class="directory",
            )

        api = _get_api_client(self.hass, entry_id)
        if kind == MEDIA_TYPE_FILE:
            raise BrowseError("Library files do not have child items")

        folder_id = value if kind == MEDIA_TYPE_FOLDER else None
        result = await _async_browse_library(api, folder_id)
        title = _entry_title(self.hass, entry_id)

        folder_name = None
        if folder_id:
            folder_name = next((folder.get("name") for folder in result.folders if folder.get("id") == folder_id), None)

        return BrowseMediaSource(
            domain=DOMAIN,
            identifier=item.identifier or "",
            media_class="directory",
            media_content_type=MEDIA_TYPE_FOLDER,
            title=folder_name or title,
            can_play=False,
            can_expand=True,
            children=[
                *_folder_children(api, result.folders, folder_id, entry_id),
                *_file_children(api, result.files, entry_id),
            ],
            children_media_class="directory",
        )


async def _async_browse_library(api: PrintStreamBridgeApiClient, folder_id: str | None) -> _LibraryBrowseResult:
    try:
        folders_payload = await api.async_get_json("/api/library/folders")
        files_payload = await api.async_get_json(
            "/api/library" if folder_id is None else f"/api/library?{urlencode({'folderId': folder_id})}"
        )
    except PrintStreamBridgeApiError as err:
        raise BrowseError(str(err)) from err

    folders = folders_payload.get("folders", []) if isinstance(folders_payload, dict) else []
    files = files_payload.get("files", []) if isinstance(files_payload, dict) else []
    return _LibraryBrowseResult(
        folders=[folder for folder in folders if isinstance(folder, dict)],
        files=[file for file in files if isinstance(file, dict)],
    )


def _folder_children(
    api: PrintStreamBridgeApiClient,
    folders: list[dict[str, Any]],
    parent_id: str | None,
    entry_id: str | None,
) -> list[BrowseMediaSource]:
    children: list[BrowseMediaSource] = []
    for folder in folders:
        if folder.get("parentId") != parent_id:
            continue
        folder_id = folder.get("id")
        folder_name = folder.get("name")
        if not isinstance(folder_id, str) or not isinstance(folder_name, str):
            continue
        children.append(
            BrowseMediaSource(
                domain=DOMAIN,
                identifier=_build_identifier(entry_id, MEDIA_TYPE_FOLDER, folder_id),
                media_class="directory",
                media_content_type=MEDIA_TYPE_FOLDER,
                title=folder_name,
                can_play=False,
                can_expand=True,
            )
        )
    return children


def _file_children(api: PrintStreamBridgeApiClient, files: list[dict[str, Any]], entry_id: str | None) -> list[BrowseMediaSource]:
    children: list[BrowseMediaSource] = []
    for file in files:
        file_id = file.get("id")
        name = file.get("name")
        kind = file.get("kind")
        if not isinstance(file_id, str) or not isinstance(name, str):
            continue
        thumbnail = None
        if kind in {"3mf", "gcode"}:
            thumbnail = build_url(api.base_url, f"/api/library/{file_id}/thumbnail")
        children.append(
            BrowseMediaSource(
                domain=DOMAIN,
                identifier=_build_identifier(entry_id, MEDIA_TYPE_FILE, file_id),
                media_class="app",
                media_content_type=kind if isinstance(kind, str) else MEDIA_TYPE_FILE,
                title=name,
                can_play=True,
                can_expand=False,
                thumbnail=thumbnail,
            )
        )
    return children


def _entry_children(hass: HomeAssistant) -> list[BrowseMediaSource]:
    return [
        BrowseMediaSource(
            domain=DOMAIN,
            identifier=_build_identifier(entry.entry_id),
            media_class="directory",
            media_content_type=MEDIA_TYPE_FOLDER,
            title=entry.title or "PrintStream",
            can_play=False,
            can_expand=True,
        )
        for entry in hass.config_entries.async_entries(DOMAIN)
    ]


def _get_api_client(hass: HomeAssistant, entry_id: str | None) -> PrintStreamBridgeApiClient:
    entries = hass.data.get(DOMAIN, {})
    if not isinstance(entries, dict) or not entries:
        raise BrowseError("PrintStream is not configured")

    if entry_id is not None:
        selected_entry = entries.get(entry_id)
        coordinator = selected_entry.get(DATA_COORDINATOR) if isinstance(selected_entry, dict) else None
        if coordinator is None or not hasattr(coordinator, "api"):
            raise BrowseError("Selected PrintStream connection is not ready")
        return coordinator.api

    if len(entries) > 1:
        raise BrowseError("Select a PrintStream connection first")

    first_entry = next(iter(entries.values()), None)
    coordinator = first_entry.get(DATA_COORDINATOR) if isinstance(first_entry, dict) else None
    if coordinator is None or not hasattr(coordinator, "api"):
        raise BrowseError("PrintStream is not ready")
    return coordinator.api


def _parse_identifier(identifier: str | None) -> tuple[str | None, str, str | None]:
    if not identifier:
        return (None, MEDIA_TYPE_FOLDER, None)

    parts = identifier.split("|")
    entry_id: str | None = None
    kind = MEDIA_TYPE_FOLDER
    value: str | None = None

    if parts and parts[0].startswith(f"{MEDIA_TYPE_ENTRY}:"):
        _, entry_value = parts[0].split(":", 1)
        entry_id = entry_value or None
        parts = parts[1:]

    if not parts:
        return (entry_id, MEDIA_TYPE_FOLDER, None)

    token = parts[0]
    if ":" not in token:
        return (entry_id, MEDIA_TYPE_FOLDER, token)

    kind, raw_value = token.split(":", 1)
    return (entry_id, kind, raw_value or None)


def _build_identifier(entry_id: str | None, kind: str | None = None, value: str | None = None) -> str:
    parts: list[str] = []
    if entry_id:
        parts.append(f"{MEDIA_TYPE_ENTRY}:{entry_id}")
    if kind and value:
        parts.append(f"{kind}:{value}")
    return "|".join(parts)


def _entry_title(hass: HomeAssistant, entry_id: str | None) -> str:
    if entry_id is None:
        return PrintStreamLibraryMediaSource.name

    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.entry_id == entry_id:
            return entry.title or PrintStreamLibraryMediaSource.name

    return PrintStreamLibraryMediaSource.name


def _has_multiple_entries(hass: HomeAssistant) -> bool:
    return len(hass.config_entries.async_entries(DOMAIN)) > 1