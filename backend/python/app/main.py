from fastapi import FastAPI, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from .config import settings
from .mcp_client import list_tools, call_tool
app=FastAPI(title="PowerChain MCP Python Gateway",version="1.0.0",docs_url=None if settings.production else "/docs")
def internal_auth(authorization: str | None = Header(default=None)):
    token=(authorization or "").removeprefix("Bearer ")
    if not settings.secret or token != settings.secret: raise HTTPException(status_code=401,detail="unauthorized")
class CallBody(BaseModel):
    server_id:str=Field(alias="serverId")
    tool_name:str=Field(alias="toolName")
    arguments:dict={}
@app.get("/health/live")
async def live(): return {"ok":True,"service":"powerchain-mcp-python","version":"1.0.0"}
@app.get("/health/ready")
async def ready(): return {"ok":True,"servers":len(settings.servers)}
@app.get("/v1/tools",dependencies=[Depends(internal_auth)])
async def tools(): return {"servers":[{"serverId":s.id,"tools":await list_tools(s)} for s in settings.servers]}
@app.post("/v1/tools/call",dependencies=[Depends(internal_auth)])
async def call(body:CallBody):
    server=next((s for s in settings.servers if s.id==body.server_id),None)
    if not server: raise HTTPException(status_code=404,detail="server_not_found")
    try:return await call_tool(server,body.tool_name,body.arguments)
    except ValueError as exc: raise HTTPException(status_code=400,detail=str(exc)) from exc
