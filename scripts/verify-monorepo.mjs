import { access, readFile } from "node:fs/promises";

const required = [
  "apps/mobile/package.json",
  "apps/mobile/tsconfig.json",
  "apps/mobile/expo/tsconfig.base.json",
  "apps/api/package.json",
  "apps/api/prisma/schema.prisma",
  "apps/api/prisma.config.ts",
  "apps/operations-api/package.json",
  "apps/mcp-gateway/package.json",
  "services/mcp-python/pyproject.toml",
  "packages/pwrc-credits/package.json",
  "packages/mcp-client/package.json",
  "packages/energy-contracts/package.json",
  "packages/platform-adapters/package.json",
  "packages/platform-clients/package.json",
  "tsconfig.base.json",
  "pnpm-workspace.yaml",
  "docs/MONOREPO.md"
];
let failed=false;
for (const path of required) {
  try { await access(path); console.log(`✓ ${path}`); }
  catch { failed=true; console.error(`✗ ${path}`); }
}
for (const obsolete of ["frontend","server","backend","app","src","assets","public"]) {
  try { await access(obsolete); failed=true; console.error(`✗ obsolete root path still exists: ${obsolete}`); }
  catch { console.log(`✓ no obsolete root path: ${obsolete}`); }
}
const workspace=await readFile("pnpm-workspace.yaml","utf8");
for (const pattern of ["apps/*","packages/*"]) {
  const ok=workspace.includes(pattern); console.log(`${ok?"✓":"✗"} workspace ${pattern}`); if(!ok) failed=true;
}
const mobile=JSON.parse(await readFile("apps/mobile/package.json","utf8"));
const api=JSON.parse(await readFile("apps/api/package.json","utf8"));
const checks=[
  ["mobile package name",mobile.name==="@powerchain/copilot-mobile"],
  ["mobile version",mobile.version==="1.0.0"],
  ["api package",api.name==="@powerchain/copilot-mobile-api"],
  ["api version",api.version==="1.0.0"]
];
for(const [label,ok] of checks){console.log(`${ok?"✓":"✗"} ${label}`);if(!ok)failed=true;}
if(failed) process.exit(1);
