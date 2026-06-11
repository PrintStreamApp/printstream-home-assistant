"""HTTP + WebSocket client for the PrintStream Home Assistant bridge."""
from __future__ import annotations

import asyncio
from typing import Any
from urllib.parse import urlencode

from aiohttp import ClientError, ClientResponse, ClientSession


class PrintStreamBridgeApiError(Exception):
    """Raised when the PrintStream bridge cannot be reached or parsed."""


class PrintStreamBridgeApiClient:
    """Client for the bridge snapshot endpoint and WebSocket stream."""

    def __init__(self, base_url: str, session: ClientSession, access_token: str | None = None) -> None:
        self._base_url = normalize_base_url(base_url)
        self._session = session
        self._access_token = normalize_access_token(access_token)

    @property
    def base_url(self) -> str:
        """Return the normalized HTTP base URL."""
        return self._base_url

    @property
    def session(self) -> ClientSession:
        """Return the underlying aiohttp session (used for WS connect)."""
        return self._session

    @property
    def auth_headers(self) -> dict[str, str]:
        """Return authorization headers for bridge requests when configured."""
        if not self._access_token:
            return {}
        return {"Authorization": f"Bearer {self._access_token}"}

    async def async_get_snapshot(self) -> dict[str, Any]:
        """Fetch the Home Assistant bridge snapshot from PrintStream."""
        payload = await self.async_get_json("/api/plugins/home-assistant/snapshot")

        if not isinstance(payload, dict) or not isinstance(payload.get("printers"), list):
            raise PrintStreamBridgeApiError("PrintStream returned an unexpected bridge payload")

        return payload

    async def async_get_json(self, path: str, query: dict[str, str | None] | None = None) -> Any:
        """Fetch a JSON or text payload from PrintStream."""
        url = build_url(self._base_url, path)
        if query:
            encoded = urlencode({key: value for key, value in query.items() if value is not None})
            if encoded:
                url = f"{url}?{encoded}"

        try:
            async with asyncio.timeout(10):
                response = await self._session.get(url, headers=self.auth_headers or None)
                payload = await _read_payload(response)
        except TimeoutError as err:
            raise PrintStreamBridgeApiError("Timed out while contacting PrintStream") from err
        except ClientError as err:
            raise PrintStreamBridgeApiError(f"Request failed: {err}") from err

        if response.status >= 400:
            message = _extract_error_message(payload) or f"PrintStream returned HTTP {response.status}"
            raise PrintStreamBridgeApiError(message)

        return payload

    async def async_post_json(self, path: str, payload: dict[str, Any]) -> Any:
        """POST a JSON payload to PrintStream."""
        url = build_url(self._base_url, path)

        try:
            async with asyncio.timeout(10):
                response = await self._session.post(url, json=payload, headers=self.auth_headers or None)
                response_payload = await _read_payload(response)
        except TimeoutError as err:
            raise PrintStreamBridgeApiError("Timed out while contacting PrintStream") from err
        except ClientError as err:
            raise PrintStreamBridgeApiError(f"Request failed: {err}") from err

        if response.status >= 400:
            message = _extract_error_message(response_payload) or f"PrintStream returned HTTP {response.status}"
            raise PrintStreamBridgeApiError(message)

        return response_payload

    async def async_get_bytes(self, path: str) -> bytes:
        """Fetch a binary payload from PrintStream."""
        url = build_url(self._base_url, path)

        try:
            async with asyncio.timeout(10):
                response = await self._session.get(url, headers=self.auth_headers or None)
                if response.status >= 400:
                    payload = await _read_payload(response)
                    message = _extract_error_message(payload) or f"PrintStream returned HTTP {response.status}"
                    raise PrintStreamBridgeApiError(message)
                return await response.read()
        except TimeoutError as err:
            raise PrintStreamBridgeApiError("Timed out while contacting PrintStream") from err
        except ClientError as err:
            raise PrintStreamBridgeApiError(f"Request failed: {err}") from err

    async def async_send_printer_command(self, printer_id: str, command: dict[str, Any]) -> None:
        """Dispatch a printer command through the bridge API."""
        await self.async_post_json(f"/api/printers/{printer_id}/command", command)


def normalize_base_url(value: str) -> str:
    """Normalize a user-supplied PrintStream base URL."""
    normalized = value.strip().rstrip("/")
    if not normalized:
        return normalized
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized
    return f"http://{normalized}"


def normalize_access_token(value: str | None) -> str | None:
    """Normalize an optional bearer token from config flow input."""
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def build_url(base_url: str, path: str) -> str:
    """Append an absolute path to the configured base URL."""
    suffix = path if path.startswith("/") else f"/{path}"
    return f"{base_url.rstrip('/')}{suffix}"


def build_ws_url(base_url: str) -> str:
    """Convert an HTTP base URL to the PrintStream WebSocket endpoint."""
    ws_base = base_url.replace("https://", "wss://", 1).replace("http://", "ws://", 1)
    return f"{ws_base.rstrip('/')}/ws"


async def _read_payload(response: ClientResponse) -> Any:
    """Read a JSON payload when possible and fall back to text."""
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        return await response.json()
    return await response.text()


def _extract_error_message(payload: Any) -> str | None:
    """Pull a useful message out of an error payload."""
    if isinstance(payload, dict):
        for key in ("error", "message"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    if isinstance(payload, str) and payload.strip():
        return payload.strip()
    return None
