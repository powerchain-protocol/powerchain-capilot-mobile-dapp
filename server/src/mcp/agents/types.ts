export type McpAgentId = 'researcher' | 'analyst' | 'risk' | 'capital' | 'operator';
export type McpAgentProfile = { id: McpAgentId; maxToolCalls: number; allowedFunctionPrefixes: string[]; instructions: string };
