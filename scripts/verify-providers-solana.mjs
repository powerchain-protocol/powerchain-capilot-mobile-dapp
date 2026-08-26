import { readFile } from "node:fs/promises";

let failed = false;
const checks = [];
function check(label, ok) {
  checks.push([label, Boolean(ok)]);
  if (!ok) failed = true;
}

const env = await readFile("server/.env.example", "utf8");
const prod = await readFile("server/.env.production.example", "utf8");
const front = await readFile("frontend/.env.example", "utf8");
const providers = await readFile("server/src/integrations/ai-providers.ts", "utf8");
const config = await readFile("server/src/config/env.ts", "utf8");
const solana = await readFile("server/src/config/solana.ts", "utf8");
const platform = await readFile("server/src/config/platform.ts", "utf8");
const app = await readFile("server/src/app.ts", "utf8");
const namespace = await readFile("server/src/http/api-namespace.ts", "utf8");
const mobileEnv = await readFile("frontend/src/config/env.ts", "utf8");

for (const provider of ["OPENAI", "ANTHROPIC", "GEMINI", "DEEPSEEK", "OLLAMA", "GRIDLLM", "EMERGENT_LLM"]) {
  check(`${provider} environment`, env.includes(`${provider}_`) || env.includes(`${provider}=`));
}
for (const provider of ["openai", "anthropic", "gemini", "deepseek", "ollama", "gridllm", "emergent"]) {
  check(`${provider} provider router`, providers.includes(`\"${provider}\"`));
}

check("frontend API 127.0.0.1:8000", front.includes("EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1"));
check("frontend devnet", front.includes("EXPO_PUBLIC_NETWORK=devnet"));
check("frontend demo mode", front.includes("EXPO_PUBLIC_DATA_MODE=demo"));
check("frontend managed AI", front.includes("EXPO_PUBLIC_AI_MODE=managed"));
check("PowerChain credit token", env.includes("POWERCHAIN_CREDIT_TOKEN=PWRC"));
check("canonical PWRC mainnet mint", env.includes("PWRC_MINT_MAINNET=PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc"));
check("devnet PWRC mint separate", env.includes("PWRC_MINT_DEVNET=\n"));
check("devnet does not default mainnet PWRC", mobileEnv.includes("Devnet may not implicitly use the mainnet PWRC mint"));
check("devnet RPC", env.includes("https://api.devnet.solana.com"));
check("mainnet-beta RPC", env.includes("https://api.mainnet-beta.solana.com"));
check("Helius routing", config.includes("helius-rpc.com/?api-key="));
check("PowerChain program remains configurable", env.includes("POWERCHAIN_PROGRAM_ID=\n"));
check("Energy RWA program remains configurable", env.includes("POWERCHAIN_ENERGY_RWA_PROGRAM_ID=\n"));
check("Market program configurable", env.includes("POWERCHAIN_MARKET_PROGRAM_ID=\n"));
check("Settlement program configurable", env.includes("POWERCHAIN_SETTLEMENT_PROGRAM_ID=\n"));
check("Metaplex Token Metadata", env.includes("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"));
check("Metaplex Bubblegum V2", env.includes("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"));
check("Account Compression", env.includes("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK"));
check("SPL Noop", env.includes("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"));
check("sanitized Solana runtime", solana.includes("provider: env.SOLANA_RPC_PROVIDER_EFFECTIVE") && !solana.includes("HELIUS_API_KEY:"));
check("system Solana endpoint registered", app.includes("registerSystemSolanaRoutes"));
check("system platform endpoint registered", app.includes("registerSystemPlatformRoutes"));
check("mobile system namespace allowlisted", namespace.includes('"system"'));
check("Supabase explicit", config.includes("SUPABASE_SERVICE_ROLE_KEY") && env.includes("SUPABASE_DATABASE_URL="));
check("Mongo configured", config.includes("MONGO_URL"));
check("Redis rate-limit store", config.includes("RATE_LIMIT_STORE") && env.includes("REDIS_URL="));
check("JWT mode", config.includes("AUTH_TOKEN_MODE") && env.includes("JWT_SECRET="));
check("settings encryption", env.includes("SETTINGS_ENCRYPTION_KEY="));
check("CoinGecko explicit", config.includes("COINGECKO_API_BASE_URL"));
check("CoinMarketCap explicit", config.includes("COINMARKETCAP_API_BASE_URL"));
check("Jupiter explicit", config.includes("JUPITER_API_URL"));
check("platform database roles", platform.includes("authoritative-transactional-source-of-record") && platform.includes("auxiliary-document-store"));
check("Token-2022 metadata separated from Metaplex", platform.includes("token2022MetadataIndependentFromMetaplex: true"));
check("production mainnet-beta", prod.includes("SOLANA_NETWORK=mainnet-beta"));
check("production mainnet PWRC", prod.includes("POWERCHAIN_MINT=PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc"));
check("production demo credits disabled", prod.includes("PWRC_DEMO_GRANT_ENABLED=false"));

for (const [label, ok] of checks) console.log(`${ok ? "✓" : "✗"} ${label}`);
if (failed) process.exit(1);
console.log(`✓ Provider/Solana/platform environment controls (${checks.length})`);
