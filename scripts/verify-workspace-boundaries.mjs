import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
const sourceExt=new Set([".ts",".tsx",".js",".mjs"]);
async function walk(dir){const out=[];for(const e of await readdir(dir)){const p=join(dir,e),s=await stat(p);if(s.isDirectory())out.push(...await walk(p));else if(sourceExt.has(extname(p)))out.push(p)}return out}
let failed=false;
for(const dir of ["packages/pwrc-credits/src","packages/mcp-client/src","packages/energy-contracts/src","packages/platform-adapters/src","packages/platform-clients/src"]){
  for(const file of await walk(dir)){const t=await readFile(file,"utf8");if(/(?:from\s+|import\s*\()\s*["'][^"']*(?:apps|services)\//.test(t)){console.error(`✗ shared package depends on deployable app: ${file}`);failed=true}}
}
for(const [app,forbidden] of [["apps/mobile",["apps/api","apps/operations-api","apps/mcp-gateway","services/mcp-python"]],["apps/api",["apps/mobile","apps/operations-api"]],["apps/operations-api",["apps/mobile","apps/api"]]]){
  for(const file of await walk(`${app}/src`).catch(()=>[])){const t=await readFile(file,"utf8");for(const x of forbidden)if(t.includes(x)){console.error(`✗ ${app} directly references ${x}: ${file}`);failed=true}}
}
for(const path of ["apps/mobile/package.json","apps/api/package.json","apps/operations-api/package.json","apps/mcp-gateway/package.json"]){
  const pkg=JSON.parse(await readFile(path,"utf8"));for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){if(name.startsWith("@powerchain/") && !String(version).startsWith("workspace:")){console.error(`✗ ${path}: local dependency ${name} must use workspace:*`);failed=true}}
}
if(failed)process.exit(1);console.log("✓ Monorepo dependency boundaries");
