import type { ManagedTool } from '../../../packages/ai-providers/types.ts';
import type { McpAgentId, McpAgentProfile } from './types.ts';

const PROFILES: Record<McpAgentId, McpAgentProfile> = {
  researcher: { id: 'researcher', maxToolCalls: 6, allowedFunctionPrefixes: ['energy__', 'market__', 'docs__'], instructions: 'Research and summarize read-only evidence. Do not prepare execution.' },
  analyst: { id: 'analyst', maxToolCalls: 8, allowedFunctionPrefixes: ['energy__', 'market__', 'iot__', 'depin__'], instructions: 'Analyze operational evidence and state uncertainty explicitly.' },
  risk: { id: 'risk', maxToolCalls: 6, allowedFunctionPrefixes: ['energy__', 'risk__', 'market__'], instructions: 'Focus on risk, controls, exceptions and evidence gaps.' },
  capital: { id: 'capital', maxToolCalls: 6, allowedFunctionPrefixes: ['market__', 'treasury__', 'energy__'], instructions: 'Analyze capital and treasury evidence without executing transactions.' },
  operator: { id: 'operator', maxToolCalls: 8, allowedFunctionPrefixes: [], instructions: 'Coordinate approved read-only MCP tools and prepare Safe Actions when needed.' },
};

export function getMcpAgentProfile(id: string | undefined): McpAgentProfile {
  return PROFILES[(id as McpAgentId) || 'operator'] ?? PROFILES.operator;
}

export function filterToolsForAgent(tools: ManagedTool[], profile: McpAgentProfile) {
  if (profile.allowedFunctionPrefixes.length === 0) return tools;
  return tools.filter((tool) => profile.allowedFunctionPrefixes.some((prefix) => tool.name.startsWith(prefix)));
}

export function listMcpAgentProfiles(): McpAgentProfile[] {
  return Object.values(PROFILES).map((profile) => ({ ...profile, allowedFunctionPrefixes: [...profile.allowedFunctionPrefixes] }));
}
