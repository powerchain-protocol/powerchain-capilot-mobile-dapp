import { readFile, readdir, stat, access } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const roots = ["app", "src"];
const extensions = [".ts", ".tsx", ".js", ".jsx"];
const failures = [];

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const info = await stat(path);

    if (info.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (extensions.includes(extname(path))) {
      files.push(path);
    }
  }

  return files;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolvesLocal(from, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
    return true;
  }

  const base = specifier.startsWith("@/")
    ? resolve("src", specifier.slice(2))
    : resolve(dirname(from), specifier);

  const candidates = [
    base,
    ...extensions.map((extension) => `${base}${extension}`),
    ...extensions.map((extension) => join(base, `index${extension}`)),
    ...extensions.flatMap((extension) => [
      `${base}.native${extension}`,
      `${base}.web${extension}`,
      `${base}.ios${extension}`,
      `${base}.android${extension}`
    ])
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return true;
  }

  return false;
}

for (const root of roots) {
  for (const file of await walk(root)) {
    const text = await readFile(file, "utf8");
    const regex = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(text))) {
      if (!(await resolvesLocal(file, match[1]))) {
        failures.push(`${file}: ${match[1]}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Unresolved frontend imports:");
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log("✓ Frontend local imports resolve");
