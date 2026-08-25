const SAFE = /[^a-zA-Z0-9_-]+/g;
export function mcpFunctionName(serverId: string, toolName: string): string {
  const left = serverId.replace(SAFE, "_").slice(0, 24);
  const right = toolName.replace(SAFE, "_").slice(0, 36);
  return `mcp__${left}__${right}`;
}
