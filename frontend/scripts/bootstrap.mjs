import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

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

console.log("PowerChain Copilot frontend bootstrap");

if (existsSync(".expo")) {
  rmSync(".expo", { recursive: true, force: true });
}

run("npm", ["install"]);
run("npx", ["expo", "install", "--fix"]);
run("npx", ["expo-doctor"]);
run("node", ["scripts/verify-expo.mjs"]);

console.log(`
Bootstrap complete.

Start web:
  npm run web

Clean web cache:
  npm run web:clear
`);
