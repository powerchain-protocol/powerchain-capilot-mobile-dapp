export type SapPrincipal = { userId: string; organizationId: string; roles: string[] };
export type SapDecision = { allowed: boolean; reason: string };

/** Segregation-of-duties / Safe Action Policy boundary. No physical execution occurs here. */
export function evaluateSap(input: { principal: SapPrincipal; action: string; organizationId: string }): SapDecision {
  if (input.principal.organizationId !== input.organizationId) return { allowed: false, reason: 'TENANT_SCOPE_MISMATCH' };
  if (/\.execute$/.test(input.action)) return { allowed: false, reason: 'PHYSICAL_EXECUTION_DISABLED' };
  return { allowed: true, reason: 'PREPARE_ONLY' };
}
