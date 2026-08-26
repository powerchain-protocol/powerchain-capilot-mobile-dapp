import { createHash } from "node:crypto";
function stable(value:unknown):unknown { return Array.isArray(value)?value.map(stable):value&&typeof value==="object"?Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value; }
export function stableHash(value:unknown){return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");}
