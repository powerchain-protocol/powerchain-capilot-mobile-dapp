export type McpServerConfig = {
  id: string;
  url: string;
  allowedTools: string[];
  authToken?: string;
  timeoutMs?: number;
};

export type McpToolDescriptor = {
  serverId: string;
  externalName: string;
  functionName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly: true;
};

export type McpCallResult = {
  output: string;
  resultHash: string;
};
