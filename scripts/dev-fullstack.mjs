import { spawn } from "node:child_process";

const children = [];

function start(name, args, cwd) {
  const child = spawn("pnpm", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      stop(code);
    } else if (signal) {
      console.log(`${name} stopped by ${signal}`);
    }
  });

  children.push(child);
}

function stop(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(code), 100);
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

console.log("PowerChain Copilot full-stack development");
console.log("• API      http://127.0.0.1:8000/api/v1");
console.log("• Frontend Expo / Metro");
console.log("");

start("api", ["run", "dev"], "server");
start("frontend", ["exec", "expo", "start"], "frontend");
