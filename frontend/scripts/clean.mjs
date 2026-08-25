import { existsSync, rmSync } from "node:fs";

for (const path of [".expo", "dist", "web-build"]) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`✓ removed ${path}`);
  }
}
