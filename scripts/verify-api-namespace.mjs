import { access, readFile } from "node:fs/promises";

const required = [
  "apps/api/src/http/api-namespace.ts",
  "apps/api/src/http/cors-policy.ts",
  "apps/api/src/routes/cors.ts",
  "apps/api/src/routes/capilot-mobile.ts",
  "apps/api/test/api-namespace.test.ts",
  "docs/API-NAMESPACE-CORS.md",
  "apps/mobile/expo/tsconfig.base.json",
  "apps/mobile/tsconfig.expo.json",
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

const tsconfig = JSON.parse(await readFile("apps/mobile/tsconfig.json", "utf8"));
const expoConfig = JSON.parse(await readFile("apps/mobile/tsconfig.expo.json", "utf8"));
const namespace = await readFile("apps/api/src/http/api-namespace.ts", "utf8");
const cors = await readFile("apps/api/src/http/cors-policy.ts", "utf8");
const app = await readFile("apps/api/src/app.ts", "utf8");
const frontendEnv = await readFile("apps/mobile/.env.example", "utf8");

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
  ["strict CORS origin syntax validation", (await readFile("apps/api/src/config/env.ts", "utf8")).includes("validCorsOrigin")],
  ["frontend uses canonical API root", frontendEnv.includes("EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1")],
  ["system root is mobile-safe", namespace.includes('"system"')],
];

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
