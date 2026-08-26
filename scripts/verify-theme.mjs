import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
const roots=["apps/mobile/src","apps/mobile/app"],extensions=new Set([".ts",".tsx"]),failures=[];
async function walk(dir){const files=[];for(const e of await readdir(dir)){const p=join(dir,e),i=await stat(p);if(i.isDirectory())files.push(...await walk(p));else if(extensions.has(extname(p)))files.push(p)}return files}
for(const root of roots)for(const file of await walk(root)){const text=await readFile(file,"utf8");if(/import\s*\{[^}]*\bcolors\b[^}]*\}\s*from\s*["'][^"']*theme\/tokens["']/.test(text))failures.push(`${file}: imports static colors from theme/tokens`)}
if(failures.length){console.error("Theme validation failed:");for(const f of failures)console.error(`✗ ${f}`);process.exit(1)}
console.log("✓ Theme-aware mobile components do not import stale static colors");
