from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import Any
from urllib.parse import urlparse

from .config import load_settings
from .mcp_client import McpGatewayClient

settings = load_settings()
client = McpGatewayClient(settings)
app = FastAPI(title="PowerChain MCP Python Gateway", version="1.0.0", docs_url=None, redoc_url=None)


async def require_internal(authorization: str | None = Header(default=None)) -> None:
    if not settings.internal_bearer_secret or authorization != f"Bearer {settings.internal_bearer_secret}":
        raise HTTPException(status_code=401, detail="Internal bearer authentication required")


class CallRequest(BaseModel):
    functionName: str
    arguments: dict[str, Any]


@app.get("/health/live")
async def health_live():
    return {"status": "ok", "service": "powerchain-mcp-python", "version": "1.0.0"}


@app.get("/health/ready")
async def health_ready():
    return {"status": "ready" if settings.internal_bearer_secret else "not_ready", "configuredServers": len(settings.servers)}


@app.get("/v1/servers", dependencies=[Depends(require_internal)])
async def servers():
    return {"servers": [{"id": s.id, "origin": f"{urlparse(s.url).scheme}://{urlparse(s.url).netloc}", "allowedTools": list(s.allowed_tools)} for s in settings.servers]}


@app.get("/v1/tools", dependencies=[Depends(require_internal)])
async def tools():
    return {"tools": await client.list_tools()}


@app.post("/v1/tools/call", dependencies=[Depends(require_internal)])
async def call_tool(request: CallRequest):
    return await client.call(request.functionName, request.arguments)
