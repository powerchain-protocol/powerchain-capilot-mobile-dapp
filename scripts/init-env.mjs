import {
  copyFile,
  access,
  readFile,
  writeFile,
} from "node:fs/promises";

const targets = [
  [".env.example", ".env"],
  ["apps/mobile/.env.example", "apps/mobile/.env"],
  ["apps/api/.env.example", "apps/api/.env"],
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

for (const [example, target] of targets) {
  if (await exists(target)) {
    console.log(`• keep ${target} (already exists)`);
    continue;
  }

  await copyFile(example, target);
  console.log(`✓ created ${target}`);
}

console.log(`
Environment templates initialized.

Next:
  1. Fill provider secrets only in apps/api/.env
  2. Start PostgreSQL: npm run db:up
  3. Apply Prisma:     npm run prisma:generate && npm run prisma:migrate
  4. Start stack:      npm run dev:stack
`);
