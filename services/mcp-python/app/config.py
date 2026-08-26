import json, os
from pydantic import BaseModel, HttpUrl, field_validator
class ServerConfig(BaseModel):
    id: str
    url: HttpUrl
    allowed_tools: list[str]
    authorization_header: str | None = None
class Settings(BaseModel):
    production: bool = os.getenv("NODE_ENV") == "production"
    secret: str = os.getenv("MCP_INTERNAL_GATEWAY_SECRET", "")
    allowed_hosts: set[str] = set(filter(None, (x.strip() for x in os.getenv("MCP_ALLOWED_HOSTS", "").split(","))))
    servers: list[ServerConfig] = [ServerConfig.model_validate(x) for x in json.loads(os.getenv("MCP_SERVERS_JSON", "[]"))]
    timeout_seconds: float = float(os.getenv("MCP_TOOL_TIMEOUT_SECONDS", "15"))
    max_argument_bytes: int = int(os.getenv("MCP_MAX_ARGUMENT_BYTES", "8192"))
    max_result_chars: int = int(os.getenv("MCP_MAX_RESULT_CHARS", "12000"))
settings = Settings()
if settings.production and len(settings.secret) < 32: raise RuntimeError("MCP_INTERNAL_GATEWAY_SECRET must be configured in production")
if settings.production and any(not s.allowed_tools for s in settings.servers): raise RuntimeError("Every production MCP server requires allowed_tools")
