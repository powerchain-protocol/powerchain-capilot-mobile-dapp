import { readFile } from "node:fs/promises";
const expectedVersion="1.0.0";
const version=(await readFile("VERSION","utf8")).trim();
const paths=[
 ["root","package.json"],
 ["mobile","apps/mobile/package.json"],
 ["api","apps/api/package.json"],
 ["operations API","apps/operations-api/package.json"],
 ["MCP gateway","apps/mcp-gateway/package.json"],
 ["PWRC credits","packages/pwrc-credits/package.json"],
 ["MCP client","packages/mcp-client/package.json"],
 ["energy contracts","packages/energy-contracts/package.json"],
 ["platform adapters","packages/platform-adapters/package.json"],
 ["platform clients","packages/platform-clients/package.json"]
];
let failed=version!==expectedVersion;
console.log(`${!failed?"✓":"✗"} VERSION ${version}`);
for(const [label,path] of paths){const pkg=JSON.parse(await readFile(path,"utf8"));const ok=pkg.version===expectedVersion;console.log(`${ok?"✓":"✗"} ${label} ${pkg.version}`);if(!ok)failed=true;}
const expo=await readFile("apps/mobile/app.config.ts","utf8");
const py=await readFile("services/mcp-python/pyproject.toml","utf8");
const changelog=await readFile("CHANGELOG.md","utf8");
const license=await readFile("LICENSE","utf8");
for(const [label,ok] of [
 ["mobile Expo config",expo.includes(`version: "${expectedVersion}"`)],
 ["Python MCP service",py.includes(`version = "${expectedVersion}"`)],
 ["CHANGELOG",changelog.includes("## [1.0.0]")],
 ["LICENSE",license.startsWith("MIT License")]
]){console.log(`${ok?"✓":"✗"} ${label}`);if(!ok)failed=true;}
if(failed)process.exit(1);
