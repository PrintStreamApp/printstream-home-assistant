"""Diagnostics for a PrintStream config entry (CONF-8, LOG-6, SEC-15).

What a user downloads from the entry's menu to attach to an issue: the entry's settings,
whether the connection is healthy, and the last snapshot PrintStream sent. Secrets and
identifying details never appear in it: the access token, printer serial numbers, hosts
and IP addresses are redacted, and the PrintStream URL keeps only its scheme, host and
port, dropping any user name, password, path or query.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlsplit

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_ACCESS_TOKEN, CONF_HUB_URL, DATA_COORDINATOR, DOMAIN

# Keys redacted wherever they appear in the entry data or the snapshot.
TO_REDACT = {
    CONF_ACCESS_TOKEN,
    "accessCode",
    "token",
    "serial",
    "printerSerial",
    "host",
    "ipAddress",
}


def redact_url(url: Any) -> str | None:
    """Reduce a URL to scheme, host and port, so no credential or path can leak.

    Returns None for a missing value and a fixed marker for anything unparseable.
    """
    if not url:
        return None
    try:
        parts = urlsplit(str(url))
        host = parts.hostname
        port = parts.port
    except ValueError:
        return "**REDACTED**"
    if not parts.scheme or not host:
        return "**REDACTED**"
    netloc = f"[{host}]" if ":" in host else host
    if port is not None:
        netloc = f"{netloc}:{port}"
    return f"{parts.scheme}://{netloc}"


def build_diagnostics(
    entry_data: dict[str, Any],
    snapshot: dict[str, Any] | None,
    connection: dict[str, Any],
) -> dict[str, Any]:
    """Assemble the redacted diagnostics document (kept pure so tests can drive it)."""
    data = async_redact_data(dict(entry_data), TO_REDACT)
    if CONF_HUB_URL in data:
        data[CONF_HUB_URL] = redact_url(data[CONF_HUB_URL])
    return {
        "entry": data,
        "connection": connection,
        "snapshot": async_redact_data(snapshot, TO_REDACT) if snapshot else None,
    }


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for one PrintStream entry."""
    coordinator = (
        hass.data.get(DOMAIN, {}).get(entry.entry_id, {}).get(DATA_COORDINATOR)
    )
    if coordinator is None:
        return build_diagnostics(dict(entry.data), None, {"loaded": False})

    current = coordinator.data
    snapshot = (
        {"generated_at": current.generated_at, "printers": current.printers}
        if current
        else None
    )
    connection = {
        "loaded": True,
        "last_update_success": coordinator.last_update_success,
        "live_updates_running": coordinator.live_updates_running,
    }
    return build_diagnostics(dict(entry.data), snapshot, connection)
