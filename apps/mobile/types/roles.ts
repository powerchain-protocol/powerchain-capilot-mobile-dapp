export type OperationalRole = 'operator' | 'asset_manager' | 'maintenance' | 'treasury' | 'admin';

export const OPERATIONAL_ROLES: Array<{ id: OperationalRole; label: string }> = [
  { id: 'operator', label: 'Operator' },
  { id: 'asset_manager', label: 'Asset Manager' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'treasury', label: 'Treasury' },
  { id: 'admin', label: 'Admin' },
];
