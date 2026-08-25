export interface McpServerDefinition {
  id: string;
  url: string;
  allowedTools: string[];
  authorizationHeader?: string;
}

export interface McpToolDescriptor {
  serverId: string;
  serverUrl: string;
  name: string;
  functionName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly: boolean;
}

export interface McpToolCallResult {
  serverId: string;
  toolName: string;
  functionName: string;
  content: string;
  isError: boolean;
  latencyMs: number;
}

export interface McpSecurityLimits {
  maxTools: number;
  maxToolCalls: number;
  maxArgumentBytes: number;
  maxToolSchemaBytes: number;
  maxResultChars: number;
  timeoutMs: number;
}
