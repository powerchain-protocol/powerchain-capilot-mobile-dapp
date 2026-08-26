import { readFile, access } from "node:fs/promises";
const root=JSON.parse(await readFile("tsconfig.json","utf8"));
const base=JSON.parse(await readFile("tsconfig.base.json","utf8"));
const mobile=JSON.parse(await readFile("apps/mobile/tsconfig.json","utf8"));
const mobileExpo=JSON.parse(await readFile("apps/mobile/tsconfig.expo.json","utf8"));
const api=JSON.parse(await readFile("apps/api/tsconfig.json","utf8"));
const checks=[
 ["root extends shared base",root.extends==="./tsconfig.base.json"],
 ["root excludes apps",root.exclude?.includes("apps")],
 ["root excludes packages",root.exclude?.includes("packages")],
 ["mobile editor uses local Expo bootstrap",mobile.extends==="./expo/tsconfig.base.json"],
 ["mobile installed validation uses official Expo base",mobileExpo.extends==="expo/tsconfig.base"],
 ["API extends shared base",api.extends==="../../tsconfig.base.json"],
 ["shared base strict",base.compilerOptions?.strict===true]
];
let failed=false;for(const[label,ok]of checks){console.log(`${ok?"✓":"✗"} ${label}`);if(!ok)failed=true;}
for(const path of ["types/workspace.d.ts","apps/mobile/expo/tsconfig.base.json"]){try{await access(path);console.log(`✓ ${path}`)}catch{failed=true;console.error(`✗ ${path}`)}}
if(failed)process.exit(1);
