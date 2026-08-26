import { readFile, readdir, stat, access } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const roots = [
  "apps/mobile/app", "apps/mobile/src", "apps/api/src",
  "apps/operations-api/src", "apps/mcp-gateway/src",
  "packages/pwrc-credits/src", "packages/mcp-client/src",
  "packages/energy-contracts/src", "packages/platform-adapters/src",
  "packages/platform-clients/src"
];
const extensions=[".ts",".tsx",".js",".jsx",".mjs"];
const failures=[];
async function walk(dir){const out=[];for(const e of await readdir(dir)){const p=join(dir,e),s=await stat(p);if(s.isDirectory())out.push(...await walk(p));else if(extensions.includes(extname(p)))out.push(p)}return out}
async function exists(p){try{await access(p);return true}catch{return false}}
function aliasBase(from,spec){
  if(from.startsWith("apps/mobile/")){
    if(spec.startsWith("@/")) return resolve("apps/mobile/src",spec.slice(2));
    if(spec.startsWith("@shared/")) return resolve("apps/mobile/src/shared",spec.slice(8));
    if(spec.startsWith("@storage/")) return resolve("apps/mobile/src/storage",spec.slice(9));
    if(spec.startsWith("@store/")) return resolve("apps/mobile/src/store",spec.slice(7));
    if(spec.startsWith("@utils/")) return resolve("apps/mobile/src/utils",spec.slice(7));
  }
  return null;
}
async function resolvesLocal(from,spec){
  if(spec.includes("generated/prisma")) return true;
  if(spec.startsWith("@powerchain/")) return true;
  let base=aliasBase(from,spec);
  if(!base){if(!spec.startsWith("."))return true;base=resolve(dirname(from),spec.replace(/\.js$/, ""));}
  const candidates=[base,...extensions.map(e=>`${base}${e}`),...extensions.map(e=>join(base,`index${e}`)),...extensions.flatMap(e=>[`${base}.native${e}`,`${base}.web${e}`,`${base}.ios${e}`,`${base}.android${e}`])];
  for(const c of candidates)if(await exists(c))return true;return false;
}
for(const root of roots){if(!(await exists(root)))continue;for(const file of await walk(root)){const text=await readFile(file,"utf8"),re=/(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;let m;while((m=re.exec(text)))if(!(await resolvesLocal(file,m[1])))failures.push(`${file}: ${m[1]}`)}}
if(failures.length){console.error("Unresolved local imports:");for(const f of failures)console.error(`✗ ${f}`);process.exit(1)}
console.log("✓ Monorepo local import resolution");
