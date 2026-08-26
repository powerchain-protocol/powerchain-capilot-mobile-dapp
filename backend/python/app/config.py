from __future__ import annotations

from dataclasses import dataclass
import json
import os
from typing import Any


@dataclass(frozen=True)
class McpServer:
    id: str
    url: str
    allowed_tools: tuple[str, ...]
    auth_token: str | None = None
    timeout_ms: int = 15000


@dataclass(frozen=True)
class Settings:
    production: bool
    internal_bearer_secret: str
    allowed_hosts: frozenset[str]
    servers: tuple[McpServer, ...]


def load_settings(env: dict[str, str] | None = None) -> Settings:
    source = env or os.environ
    production = source.get("NODE_ENV", "development") == "production"
    raw = json.loads(source.get("MCP_SERVERS_JSON", "[]"))
    if not isinstance(raw, list):
        raise ValueError("MCP_SERVERS_JSON must be an array")
    servers: list[McpServer] = []
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("MCP server entries must be objects")
        server_id = str(item.get("id", "")).strip()
        url = str(item.get("url", "")).strip()
        tools_raw: Any = item.get("allowedTools", [])
        if not isinstance(tools_raw, list) or not all(isinstance(v, str) and v.strip() for v in tools_raw):
            raise ValueError(f"Invalid allowedTools for MCP server {server_id}")
        allowed_tools = tuple(v.strip() for v in tools_raw)
        if production and not allowed_tools:
            raise ValueError(f"Production MCP server {server_id} requires explicit non-empty allowedTools")
        if len(set(allowed_tools)) != len(allowed_tools):
            raise ValueError(f"Duplicate allowedTools for MCP server {server_id}")
        if not server_id or not url:
            raise ValueError("MCP server id and url are required")
        timeout_ms = int(item.get('timeoutMs', 15000))
        if timeout_ms < 1000 or timeout_ms > 120000:
            raise ValueError(f'Invalid timeoutMs for MCP server {server_id}')
        servers.append(McpServer(server_id, url, allowed_tools, str(item.get("authToken") or "").strip() or None, timeout_ms))
    allowed_hosts = {v.strip() for v in source.get("MCP_ALLOWED_HOSTS", "").split(",") if v.strip()}
    from urllib.parse import urlparse
    for server in servers:
        host = urlparse(server.url).hostname
        if production and host and host not in allowed_hosts:
            raise ValueError(f"Production MCP hostname must be explicitly present in MCP_ALLOWED_HOSTS: {host}")
        if not production and not allowed_hosts and host:
            allowed_hosts.add(host)
    return Settings(
        production=production,
        internal_bearer_secret=source.get("MCP_INTERNAL_BEARER_SECRET", "").strip(),
        allowed_hosts=frozenset(allowed_hosts),
        servers=tuple(servers),
    )
