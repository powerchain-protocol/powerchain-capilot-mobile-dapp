export type MemoryKind = "preference" | "site_context" | "workflow" | "decision_note";
export interface MemoryRecord { id:string; slug:string; kind:MemoryKind|string; content:string; metadata?:Record<string,unknown>; updatedAt:string; expiresAt?:string|null; }
