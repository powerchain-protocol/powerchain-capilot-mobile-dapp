import {
  readFile,
  readdir,
  stat,
} from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "app"];
const extensions = new Set([".ts", ".tsx"]);
const failures = [];

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const info = await stat(path);

    if (info.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (extensions.has(extname(path))) {
      files.push(path);
    }
  }

  return files;
}

for (const root of roots) {
  for (const file of await walk(root)) {
    const text = await readFile(file, "utf8");

    if (
      /import\s*\{[^}]*\bcolors\b[^}]*\}\s*from\s*["'][^"']*theme\/tokens["']/.test(
        text,
      )
    ) {
      failures.push(
        `${file}: imports static colors from theme/tokens`,
      );
    }
  }
}

if (failures.length) {
  console.error("Theme validation failed:");
  for (const failure of failures) {
    console.error(`✗ ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "✓ Theme-aware components do not import stale static colors",
  );
}
