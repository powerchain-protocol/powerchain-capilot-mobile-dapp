import { access, readFile } from "node:fs/promises";

const required = [
  "server/src/http/api-namespace.ts",
  "server/src/http/cors-policy.ts",
  "server/src/routes/cors.ts",
  "server/src/routes/capilot-mobile.ts",
  "server/test/api-namespace.test.ts",
  "docs/API-NAMESPACE-CORS.md",
  "frontend/expo/tsconfig.base.json",
  "frontend/tsconfig.expo.json",
];

let failed = false;
for (const path of required) {
  try {
    await access(path);
    console.log(`✓ ${path}`);
  } catch {
    console.error(`✗ ${path}`);
    failed = true;
  }
}

const tsconfig = JSON.parse(await readFile("frontend/tsconfig.json", "utf8"));
const expoConfig = JSON.parse(await readFile("frontend/tsconfig.expo.json", "utf8"));
const namespace = await readFile("server/src/http/api-namespace.ts", "utf8");
const cors = await readFile("server/src/http/cors-policy.ts", "utf8");
const app = await readFile("server/src/app.ts", "utf8");
const frontendEnv = await readFile("frontend/.env.example", "utf8");

const checks = [
  ["frontend editor uses local Expo base", tsconfig.extends === "./expo/tsconfig.base.json"],
  ["installed Expo validation remains official", expoConfig.extends === "expo/tsconfig.base"],
  ["requested capilot-mobile namespace", namespace.includes('"/api/v1/capilot-mobile"')],
  ["corrected copilot-mobile alias", namespace.includes('"/api/v1/copilot-mobile"')],
  ["mobile namespace is allowlisted", namespace.includes("MOBILE_SAFE_ROOTS")],
  ["internal route is not mobile mirrored", namespace.includes("internalRoutesMirrored: false")],
  ["Fastify rewrite is active", app.includes("rewriteMobileApiUrl(request.url)")],
  ["central CORS policy is active", app.includes("buildCorsOptions()")],
  ["native no-Origin requests are supported", cors.includes("if (!origin) return true")],
  ["production wildcard is fail-closed", cors.includes('env.NODE_ENV !== "production"')],
  ["strict CORS origin syntax validation", (await readFile("server/src/config/env.ts", "utf8")).includes("validCorsOrigin")],
  ["frontend uses namespaced API", frontendEnv.includes("/api/v1/capilot-mobile")],
];

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
