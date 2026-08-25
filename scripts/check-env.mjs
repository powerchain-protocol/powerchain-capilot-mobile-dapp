import {
  readFile,
  access,
} from "node:fs/promises";

const secretPatterns = [
  /^OPENAI_API_KEY=/m,
  /^PYTH_API_KEY=/m,
  /^BIRDEYE_API_KEY=/m,
  /^DATABASE_URL=/m,
  /^PAYMENT_KERNEL_WEBHOOK_SECRET=/m,
  /^PWRC_TREASURY_ADDRESS=/m,
];

const requiredExamples = {
  ".env.example": [
    "DATABASE_URL",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
  ],
  "frontend/.env.example": [
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_SOLANA_NETWORK",
    "EXPO_PUBLIC_SOLANA_RPC_URL",
    "EXPO_PUBLIC_SUI_NETWORK",
    "EXPO_PUBLIC_SUI_RPC_URL",
  ],
  "server/.env.example": [
    "DATABASE_URL",
    "CORS_ORIGIN",
    "SOLANA_RPC_URL",
    "OPENAI_API_KEY",
    "PYTH_API_KEY",
    "BIRDEYE_API_KEY",
    "SUI_RPC_URL",
    "AI_RATE_LIMIT",
    "MARKET_CACHE_FRESH_MS",
    "MARKET_CACHE_STALE_MS",
    "PWRC_CREDITS_ENABLED",
    "PWRC_CREDIT_NETWORK",
    "PWRC_CREDIT_RESERVATION_TTL_SECONDS",
    "PWRC_CREDIT_ACK_TTL_SECONDS",
    "PWRC_DEMO_GRANT_ENABLED",
    "PWRC_TOPUPS_ENABLED",
    "PWRC_TREASURY_ADDRESS",
    "PAYMENT_KERNEL_WEBHOOK_SECRET",
    "PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS",
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

// Public frontend env must never carry server secrets.
const frontend = await readFile("frontend/.env.example", "utf8");
for (const pattern of secretPatterns) {
  if (pattern.test(frontend)) {
    failed = true;
    console.error(
      "✗ frontend/.env.example contains a server-only secret field",
    );
  }
}

// Actual .env files are optional for repository verification.
for (const file of [".env", "frontend/.env", "server/.env"]) {
  try {
    await access(file);
    console.log(`• found ${file}`);
  } catch {
    console.log(`• ${file} not initialized`);
  }
}

if (failed) process.exit(1);

console.log("✓ Environment contract");
