import { access, readFile } from "node:fs/promises";

let failed = false;
const tsconfig = JSON.parse(await readFile("tsconfig.json", "utf8"));
const installed = JSON.parse(await readFile("tsconfig.expo.json", "utf8"));

const checks = [
  ["editor config uses checked-in Expo bootstrap base", tsconfig.extends === "./expo/tsconfig.base.json"],
  ["installed Expo validation uses package base", installed.extends === "expo/tsconfig.base"],
  ["path aliases remain frontend-local", tsconfig.compilerOptions?.paths?.["@/*"]?.[0] === "./src/*"],
];

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}

try {
  await access("expo/tsconfig.base.json");
  console.log("✓ expo/tsconfig.base.json");
} catch {
  console.error("✗ expo/tsconfig.base.json");
  failed = true;
}

if (failed) process.exit(1);
