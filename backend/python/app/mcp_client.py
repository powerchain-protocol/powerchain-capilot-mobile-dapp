from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from .config import Settings, McpServer
from .security import assert_arguments_safe, assert_safe_url, assert_schema_size, normalize_description, normalize_result


def function_name(server_id: str, tool_name: str) -> str:
    base = re.sub(r"_+", "_", re.sub(r"[^a-z0-9_]", "_", f"mcp_{server_id}_{tool_name}".lower()))
    if len(base) <= 64:
        return base
    import hashlib
    suffix = hashlib.sha256(f"{server_id}/{tool_name}".encode()).hexdigest()[:10]
    return f"{base[:53]}_{suffix}"


class McpGatewayClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def _session(self, server: McpServer):
        assert_safe_url(server.url, self.settings.allowed_hosts, self.settings.production)
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
        headers = {"Authorization": f"Bearer {server.auth_token}"} if server.auth_token else None
        transport = streamablehttp_client(server.url, headers=headers)
        return ClientSession, transport

    async def list_tools(self) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        max_tools = 64
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
        for server in self.settings.servers:
            assert_safe_url(server.url, self.settings.allowed_hosts, self.settings.production)
            headers = {"Authorization": f"Bearer {server.auth_token}"} if server.auth_token else None
            async with streamablehttp_client(server.url, headers=headers) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    async with asyncio.timeout(server.timeout_ms / 1000):
                        result = await session.list_tools()
                    for tool in result.tools:
                        if len(output) >= max_tools:
                            raise ValueError('MCP tool count limit exceeded')
                        annotations = getattr(tool, "annotations", None)
                        read_only = getattr(annotations, "readOnlyHint", None) if annotations else None
                        if tool.name not in server.allowed_tools or read_only is not True:
                            continue
                        schema = getattr(tool, "inputSchema", {}) or {}
                        assert_schema_size(schema)
                        output.append({
                            "serverId": server.id,
                            "externalName": tool.name,
                            "functionName": function_name(server.id, tool.name),
                            "description": normalize_description(getattr(tool, "description", "")),
                            "inputSchema": schema,
                            "readOnly": True,
                        })
        return output

    async def call(self, requested_function: str, arguments: dict[str, Any]) -> dict[str, str]:
        assert_arguments_safe(arguments)
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
        for server in self.settings.servers:
            assert_safe_url(server.url, self.settings.allowed_hosts, self.settings.production)
            headers = {"Authorization": f"Bearer {server.auth_token}"} if server.auth_token else None
            async with streamablehttp_client(server.url, headers=headers) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    async with asyncio.timeout(server.timeout_ms / 1000):
                        listed = await session.list_tools()
                    for tool in listed.tools:
                        if function_name(server.id, tool.name) != requested_function:
                            continue
                        annotations = getattr(tool, "annotations", None)
                        read_only = getattr(annotations, "readOnlyHint", None) if annotations else None
                        if tool.name not in server.allowed_tools or read_only is not True:
                            raise ValueError("MCP tool is not approved read-only at execution time")
                        assert_schema_size(getattr(tool, "inputSchema", {}) or {})
                        async with asyncio.timeout(server.timeout_ms / 1000):
                            result = await session.call_tool(tool.name, arguments)
                        text, digest = normalize_result(getattr(result, "content", result))
                        return {"output": text, "resultHash": digest}
        raise ValueError("Unknown or unavailable MCP function")
