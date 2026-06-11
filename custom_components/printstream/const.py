"""Constants for the PrintStream Bridge integration."""
from __future__ import annotations

import os
from pathlib import Path

from homeassistant.const import Platform

DOMAIN = "printstream"
NAME = "PrintStream Bridge"
MANUFACTURER = "Bambu Lab"

CONF_HUB_URL = "hub_url"
CONF_ACCESS_TOKEN = "access_token"

DEFAULT_NAME = "PrintStream"

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR, Platform.CAMERA, Platform.IMAGE]

DATA_CARD_RESOURCE_REGISTERED = "card_resource_registered"
DATA_COORDINATOR = "coordinator"

CARD_RESOURCE_VERSION = "0.3.32"
CARD_RESOURCE_URL = f"/printstream/printstream-cards.js?v={CARD_RESOURCE_VERSION}"
CARD_RESOURCE_FILENAME = "printstream-cards.js"


def _resolve_default_hub_url() -> str:
    """Resolve the setup-flow default URL from env or fall back to hosted app."""
    configured_origin = _normalize_origin_list_value(os.environ.get("CLIENT_ORIGIN"))
    if configured_origin:
        return configured_origin

    for dotenv_path in _iter_dotenv_candidates():
        dotenv_origin = _read_dotenv_value(dotenv_path, "CLIENT_ORIGIN")
        if dotenv_origin:
            return dotenv_origin

    return "https://printstream.app"


def _iter_dotenv_candidates() -> list[Path]:
    seen: set[Path] = set()
    candidates: list[Path] = []

    for base in [Path.cwd(), *Path(__file__).resolve().parents]:
        candidate = base / ".env"
        if candidate in seen:
            continue
        seen.add(candidate)
        candidates.append(candidate)

    return candidates


def _read_dotenv_value(dotenv_path: Path, key: str) -> str | None:
    if not dotenv_path.is_file():
        return None

    try:
        lines = dotenv_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        name, raw_value = stripped.split("=", 1)
        if name.strip() != key:
            continue
        value = raw_value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        return _normalize_origin_list_value(value)

    return None


def _normalize_origin_list_value(value: str | None) -> str | None:
    if value is None:
        return None

    for origin in value.split(","):
        normalized = origin.strip()
        if normalized:
            return normalized.rstrip("/")

    return None


DEFAULT_HUB_URL = _resolve_default_hub_url()
