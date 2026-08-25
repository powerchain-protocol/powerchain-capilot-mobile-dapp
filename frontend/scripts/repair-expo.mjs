import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const manager = process.argv[2] === "pnpm" ? "pnpm" : "npm";
const isPnpm = manager === "pnpm";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`PowerChain Copilot frontend repair using ${manager}.`);

for (const path of [".expo"]) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

if (isPnpm) {
  run("pnpm", ["install"]);
  run("pnpm", ["exec", "expo", "install", "--fix"]);
  run("pnpm", ["exec", "expo-doctor"]);
} else {
  run("npm", ["install"]);
  run("npx", ["expo", "install", "--fix"]);
  run("npx", ["expo-doctor"]);
}

console.log(`
Repair complete.

Start web with:

  ${isPnpm ? "pnpm web" : "npm run web"}

For a clean Metro cache:

  ${isPnpm ? "pnpm exec expo start --web --clear" : "npm run web:clear"}
`);
