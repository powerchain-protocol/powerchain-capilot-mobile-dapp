import { access, readFile } from "node:fs/promises";

const root = JSON.parse(await readFile("tsconfig.json", "utf8"));
const frontend = JSON.parse(await readFile("frontend/tsconfig.json", "utf8"));
const frontendExpo = JSON.parse(await readFile("frontend/tsconfig.expo.json", "utf8"));
const server = JSON.parse(await readFile("server/tsconfig.json", "utf8"));
let failed = false;

const checks = [
  ["root has a real TypeScript input", Array.isArray(root.include) && root.include.includes("types/**/*.d.ts")],
  ["root does not compile frontend", Array.isArray(root.exclude) && root.exclude.includes("frontend")],
  ["root does not compile server", Array.isArray(root.exclude) && root.exclude.includes("server")],
  ["frontend editor config uses local Expo bootstrap", frontend.extends === "./expo/tsconfig.base.json"],
  ["frontend installed validation uses official Expo base", frontendExpo.extends === "expo/tsconfig.base"],
  ["server owns backend TypeScript", Boolean(server.compilerOptions)],
];
for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}
for (const path of ["types/workspace.d.ts", "frontend/expo/tsconfig.base.json"]) {
  try { await access(path); console.log(`✓ ${path}`); }
  catch { console.error(`✗ ${path}`); failed = true; }
}
if (failed) process.exit(1);
