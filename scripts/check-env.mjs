import { readFile, access } from "node:fs/promises";

const secretPatterns = [
  /^OPENAI_API_KEY=/m,
  /^ANTHROPIC_API_KEY=/m,
  /^GEMINI_API_KEY=/m,
  /^DEEPSEEK_API_KEY=/m,
  /^OLLAMA_API_KEY=/m,
  /^GRIDLLM_API_KEY=/m,
  /^EMERGENT_LLM_KEY=/m,
  /^HELIUS_API_KEY=/m,
  /^PYTH_API_KEY=/m,
  /^BIRDEYE_API_KEY=/m,
  /^COINGECKO_API_KEY=/m,
  /^COINMARKETCAP_API_KEY=/m,
  /^JUPITER_API_KEY=/m,
  /^DATABASE_URL=/m,
  /^DIRECT_URL=/m,
  /^SUPABASE_SERVICE_ROLE_KEY=/m,
  /^MONGO_URL=/m,
  /^REDIS_URL=/m,
  /^JWT_SECRET=/m,
  /^SETTINGS_ENCRYPTION_KEY=/m,
  /^PAYMENT_KERNEL_WEBHOOK_SECRET=/m,
  /^INTERNAL_HMAC_SECRET=/m,
];

const requiredExamples = {
  ".env.example": [
    "DATABASE_URL",
    "DIRECT_URL",
    "SUPABASE_URL",
    "MONGO_URL",
    "REDIS_URL",
    "POWERCHAIN_CREDIT_TOKEN",
    "PWRC_MINT_MAINNET",
    "PWRC_MINT_DEVNET",
    "POWERCHAIN_MINT",
    "SOLANA_NETWORK",
    "METAPLEX_TOKEN_METADATA_PROGRAM_ID",
    "AI_PROVIDER_ORDER",
  ],
  "apps/mobile/.env.example": [
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_NETWORK",
    "EXPO_PUBLIC_DATA_MODE",
    "EXPO_PUBLIC_AI_MODE",
    "EXPO_PUBLIC_SOLANA_NETWORK",
    "EXPO_PUBLIC_SOLANA_RPC_URL",
    "EXPO_PUBLIC_CREDIT_TOKEN",
    "EXPO_PUBLIC_CREDIT_NETWORK",
    "EXPO_PUBLIC_PWRC_MINT_MAINNET",
    "EXPO_PUBLIC_PWRC_MINT_DEVNET",
    "EXPO_PUBLIC_SUI_NETWORK",
    "EXPO_PUBLIC_SUI_RPC_URL",
  ],
  "apps/api/.env.example": [
    "DATABASE_URL",
    "DIRECT_URL",
    "SUPABASE_URL",
    "MONGO_URL",
    "REDIS_URL",
    "JWT_SECRET",
    "SETTINGS_ENCRYPTION_KEY",
    "CORS_ORIGINS",
    "RATE_LIMIT_MAX",
    "RATE_LIMIT_WINDOW_MS",
    "AI_PRIMARY_PROVIDER",
    "AI_PROVIDER_ORDER",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
    "DEEPSEEK_API_KEY",
    "OLLAMA_BASE_URL",
    "GRIDLLM_ENABLED",
    "EMERGENT_LLM_KEY",
    "SOLANA_NETWORK",
    "SOLANA_RPC_PROVIDER",
    "SOLANA_RPC_DEVNET_URL",
    "SOLANA_RPC_MAINNET_URL",
    "HELIUS_RPC_URL",
    "HELIUS_API_KEY",
    "POWERCHAIN_PROGRAM_ID",
    "POWERCHAIN_ENERGY_RWA_PROGRAM_ID",
    "POWERCHAIN_MARKET_PROGRAM_ID",
    "POWERCHAIN_SETTLEMENT_PROGRAM_ID",
    "METAPLEX_TOKEN_METADATA_PROGRAM_ID",
    "METAPLEX_BUBBLEGUM_PROGRAM_ID",
    "POWERCHAIN_CREDIT_TOKEN",
    "PWRC_MINT_MAINNET",
    "PWRC_MINT_DEVNET",
    "POWERCHAIN_MINT",
    "PWRC_CREDITS_ENABLED",
    "PWRC_CREDIT_NETWORK",
    "SUI_NETWORK",
    "PYTH_API_KEY",
    "BIRDEYE_API_KEY",
    "COINGECKO_API_KEY",
    "COINMARKETCAP_API_KEY",
    "JUPITER_API_KEY",
  ],
};

let failed = false;
for (const [file, keys] of Object.entries(requiredExamples)) {
  const text = await readFile(file, "utf8");
  for (const key of keys) {
    const present = new RegExp(`^${key}=`, "m").test(text);
    if (!present) {
      failed = true;
      console.error(`✗ ${file}: missing ${key}`);
    }
  }
  console.log(`✓ ${file}`);
}

const frontend = await readFile("apps/mobile/.env.example", "utf8");
for (const pattern of secretPatterns) {
  if (pattern.test(frontend)) {
    failed = true;
    console.error("✗ apps/mobile/.env.example contains a server-only secret field");
  }
}

if (/EXPO_PUBLIC_PWRC_MINT=PWRCRXXZ/.test(frontend) && /EXPO_PUBLIC_CREDIT_NETWORK=devnet/.test(frontend)) {
  failed = true;
  console.error("✗ frontend devnet configuration must not default to the mainnet PWRC mint");
}

for (const file of [".env", "apps/mobile/.env", "apps/api/.env"]) {
  try {
    await access(file);
    console.log(`• found ${file}`);
  } catch {
    console.log(`• ${file} not initialized`);
  }
}

if (failed) process.exit(1);
console.log("✓ Environment contract");
