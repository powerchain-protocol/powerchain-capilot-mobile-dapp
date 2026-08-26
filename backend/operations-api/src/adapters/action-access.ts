import type { AuthPrincipal, SafeActionRequest } from '@powerchain/operations-contracts';
import type { OperationsAccessAdapter } from './access.ts';
import { OperationsApiError } from '../errors.ts';

async function requireSite(access: OperationsAccessAdapter, userId: string, siteId: string) {
  if (!(await access.canAccessSite(userId, siteId))) throw new OperationsApiError('RESOURCE_ACCESS_DENIED', 'Access to the requested operational resource is not permitted.', 403);
}

export async function authorizeSafeAction(access: OperationsAccessAdapter, principal: AuthPrincipal, request: SafeActionRequest) {
  if (request.action === 'ems.dispatch.prepare' || request.action === 'settlement.prepare') {
    await requireSite(access, principal.userId, request.resourceId);
    return;
  }
  if (request.action === 'iot.device.refresh') {
    const siteId = await access.siteIdForIotDevice(request.resourceId);
    if (!siteId) throw new OperationsApiError('RESOURCE_NOT_FOUND', 'IoT device was not found.', 404);
    await requireSite(access, principal.userId, siteId);
    return;
  }
  if (request.action === 'depin.node.refresh') {
    const siteId = await access.siteIdForDepinNode(request.resourceId);
    if (!siteId) throw new OperationsApiError('RESOURCE_NOT_FOUND', 'DePIN node was not found or is not assigned to a site.', 404);
    await requireSite(access, principal.userId, siteId);
    return;
  }
  if (request.action === 'alarm.acknowledge.prepare') {
    const siteId = await access.siteIdForAlarm(request.resourceId);
    if (!siteId) throw new OperationsApiError('RESOURCE_NOT_FOUND', 'Alarm was not found.', 404);
    await requireSite(access, principal.userId, siteId);
    return;
  }
  if (request.action === 'wallet.signature.prepare') {
    if (!(await access.canAccessWallet(principal.userId, request.resourceId))) {
      throw new OperationsApiError('RESOURCE_ACCESS_DENIED', 'Wallet does not belong to the authenticated user.', 403);
    }
  }
}
