import { readFile } from "node:fs/promises";

const expectedVersion = "1.0.0";

const version = (await readFile("VERSION", "utf8")).trim();
const rootPackage = JSON.parse(
  await readFile("package.json", "utf8"),
);
const frontendPackage = JSON.parse(
  await readFile("frontend/package.json", "utf8"),
);
const frontendConfig = await readFile(
  "frontend/app.config.ts",
  "utf8",
);
const serverPackage = JSON.parse(
  await readFile("server/package.json", "utf8"),
);
const creditsPackage = JSON.parse(
  await readFile("packages/pwrc-credits/package.json", "utf8"),
);
const mcpPackage = JSON.parse(
  await readFile("packages/mcp-client/package.json", "utf8"),
);
const expressMcpPackage = JSON.parse(
  await readFile("backend/express/package.json", "utf8"),
);
const pythonMcpProject = await readFile("backend/python/pyproject.toml", "utf8");
const changelog = await readFile("CHANGELOG.md", "utf8");
const license = await readFile("LICENSE", "utf8");

const checks = [
  ["VERSION", version === expectedVersion],
  ["root workspace", rootPackage.version === expectedVersion],
  [
    "frontend package",
    frontendPackage.version === expectedVersion &&
      frontendPackage.license === "MIT"
  ],
  [
    "frontend Expo config",
    frontendConfig.includes(`version: "${expectedVersion}"`)
  ],
  [
    "server package",
    serverPackage.version === expectedVersion &&
      serverPackage.license === "MIT"
  ],
  [
    "PWRC credits package",
    creditsPackage.version === expectedVersion
  ],
  ["MCP client package", mcpPackage.version === expectedVersion],
  ["MCP Express gateway", expressMcpPackage.version === expectedVersion],
  ["MCP Python gateway", pythonMcpProject.includes(`version = "${expectedVersion}"`)],
  ["CHANGELOG.md", changelog.includes("## [1.0.0]")],
  ["LICENSE", license.startsWith("MIT License")]
];

let failed = false;

for (const [label, ok] of checks) {
  if (ok) console.log(`✓ ${label}`);
  else {
    failed = true;
    console.error(`✗ ${label}`);
  }
}

if (failed) process.exit(1);

console.log(
  `\nRelease metadata is consistent at ${expectedVersion}.`,
);
