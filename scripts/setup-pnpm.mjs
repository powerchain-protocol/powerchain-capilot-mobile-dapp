import { spawnSync } from "node:child_process";

function run(command, args, cwd = process.cwd()) {
  console.log(`\n> ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("pnpm", ["install"]);
run("pnpm", ["--dir", "frontend", "exec", "expo", "install", "--fix"]);
run("pnpm", ["--dir", "frontend", "exec", "expo-doctor"]);
run("node", ["scripts/verify-dependencies.mjs"]);
run("pnpm", ["--dir", "frontend", "run", "verify:installed"]);
run("pnpm", ["run", "verify:mcp"]);

console.log(`
PowerChain dependencies are installed.

Expo commands:

  cd powerchain-capilot-mobile-app/frontend

  pnpm exec expo start
  pnpm exec expo run:ios
  pnpm exec expo run:android

Web:

  pnpm exec expo start --web
`);
