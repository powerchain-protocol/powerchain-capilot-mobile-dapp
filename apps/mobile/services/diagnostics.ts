import { requestJson } from '@/lib/http';
import type { DiagnosticsPayload } from '@/types/diagnostics';

export async function getDiagnostics(accessToken: string) {
  return requestJson<DiagnosticsPayload>('/api/v1/diagnostics', { authToken: accessToken });
}
