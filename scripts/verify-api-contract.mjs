import { readFile, access } from "node:fs/promises";
const required=[
  "powerchain-capilot.yaml",
  "apps/api/v1/register.ts",
  "apps/api/v1/docs.ts",
  "apps/api/v1/routes.json",
  "api/postman/powerchain-capilot.postman_collection.json",
  "api/postman/powerchain-local.postman_environment.json",
  "swagger/index.html"
];
for (const file of required) await access(file);
const app=await readFile("apps/api/src/app.ts","utf8");
if(!app.includes("registerApiV1(app)")) throw new Error("apps/api/src/app.ts must register through apps/api/v1");
const routes=JSON.parse(await readFile("apps/api/v1/routes.json","utf8"));
const postman=JSON.parse(await readFile("api/postman/powerchain-capilot.postman_collection.json","utf8"));
if(routes.length < 35) throw new Error(`Expected >=35 API-v1 routes, found ${routes.length}`);
if(postman.info?.name !== "PowerChain Copilot API v1") throw new Error("Unexpected Postman collection metadata");
const yaml=await readFile("powerchain-capilot.yaml","utf8");
for(const route of ["/api/v1/health","/api/v1/ai/chat","/api/v1/credits/account","/api/v1/internal/payment-kernel/events"]) if(!yaml.includes(route)) throw new Error(`OpenAPI missing ${route}`);
if(/HELIUS_API_KEY|SUPABASE_SERVICE_ROLE_KEY|JWT_SECRET=|INTERNAL_HMAC_SECRET=/.test(yaml)) throw new Error("OpenAPI contract contains secret material");
console.log(`✓ API v1 contract: ${routes.length} operations`);
console.log("✓ OpenAPI / Postman / Swagger artifacts present");
console.log("✓ apps/api/v1 is the registration boundary");
