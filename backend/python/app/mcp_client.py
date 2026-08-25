import asyncio
import httpx2
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from .config import ServerConfig, settings
from .security import assert_safe_arguments, assert_url_allowed

async def _session(server: ServerConfig):
    headers = {"Authorization": server.authorization_header} if server.authorization_header else {}
    timeout = httpx2.Timeout(settings.timeout_seconds)
    http_client = httpx2.AsyncClient(headers=headers, timeout=timeout, follow_redirects=False)
    transport = streamable_http_client(str(server.url), http_client=http_client)
    return http_client, transport

async def list_tools(server: ServerConfig):
    assert_url_allowed(str(server.url), settings.allowed_hosts, settings.production)
    http_client, transport = await _session(server)
    async with http_client:
        async with asyncio.timeout(settings.timeout_seconds):
            async with transport as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    result = await session.list_tools()
                    return [
                        {"name": t.name, "description": (t.description or "")[:500], "readOnly": bool(getattr(t.annotations, "read_only_hint", False))}
                        for t in result.tools
                        if t.name in server.allowed_tools and bool(getattr(t.annotations, "read_only_hint", False))
                    ]

async def call_tool(server: ServerConfig, name: str, arguments: dict):
    assert_url_allowed(str(server.url), settings.allowed_hosts, settings.production)
    if name not in server.allowed_tools: raise ValueError("tool outside configured allowlist")
    assert_safe_arguments(arguments, settings.max_argument_bytes)
    http_client, transport = await _session(server)
    async with http_client:
        async with asyncio.timeout(settings.timeout_seconds):
            async with transport as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    listed = await session.list_tools()
                    tool = next((t for t in listed.tools if t.name == name), None)
                    if tool is None or not bool(getattr(tool.annotations, "read_only_hint", False)): raise ValueError("MCP tool must declare read-only")
                    result = await session.call_tool(name, arguments)
                    parts=[]
                    for item in result.content:
                        text=getattr(item,"text",None)
                        if text: parts.append(text)
                    return {"serverId":server.id,"toolName":name,"content":("\n".join(parts) or "(tool returned no text content)")[:settings.max_result_chars],"isError":bool(result.is_error)}
