import type { ApiEnvelope, OperationalAlarm, OperationalEventPage, OperationalJournalEvent, OperationalSiteSummary, SiteDigitalTwin, JsonEvidenceExport, DigitalTwinExport } from "@powerchain/energy-contracts";
import { energyApiFetch } from "../api/energy-client";
export async function listSites(){const r=await energyApiFetch<ApiEnvelope<OperationalSiteSummary[]>>("/sites");return r.data;}
export async function getTwin(siteId:string){const r=await energyApiFetch<ApiEnvelope<SiteDigitalTwin>>(`/twin?siteId=${encodeURIComponent(siteId)}`);return r.data;}
export async function listAlarms(siteId:string,limit=20){const r=await energyApiFetch<{data:OperationalAlarm[];meta?:{page?:{nextCursor?:string}}}>(`/alarms?siteId=${encodeURIComponent(siteId)}&limit=${limit}`);return {items:r.data,nextCursor:r.meta?.page?.nextCursor};}
export async function listEvents(siteId:string,limit=30):Promise<OperationalEventPage>{const r=await energyApiFetch<{data:OperationalJournalEvent[];meta?:{page?:{nextCursor?:string}}}>(`/events?siteId=${encodeURIComponent(siteId)}&limit=${limit}`);return {items:r.data,page:{nextCursor:r.meta?.page?.nextCursor}};}
export async function exportEvidence(siteId:string){return energyApiFetch<JsonEvidenceExport>(`/exports/${encodeURIComponent(siteId)}/evidence.json`);}
export async function exportSnapshot(siteId:string){return energyApiFetch<DigitalTwinExport>(`/exports/${encodeURIComponent(siteId)}/snapshot.json`);}
