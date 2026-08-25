export type MobileEnvironment = {
  appEnv: "development" | "preview" | "production";
  releaseVersion: string;

  apiUrl: string;

  solanaNetwork: "devnet" | "mainnet-beta";
  solanaRpcUrl: string;
  token2022Program: string;
  pwrcMint?: string;
  usdcMint?: string;
  eurcMint?: string;

  suiNetwork: "devnet" | "testnet" | "mainnet";
  suiRpcUrl: string;

  features: {
    ai: boolean;
    marketData: boolean;
    notifications: boolean;
  };
};

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function boolean(
  value: string | undefined,
  fallback: boolean,
) {
  if (value == null || value === "") return fallback;
  return value === "true";
}

function requireUrl(name: string, value: string) {
  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  return normalizeUrl(value);
}

function appEnvironment(
  value: string | undefined,
): MobileEnvironment["appEnv"] {
  if (value === "production" || value === "preview") {
    return value;
  }

  return "development";
}

export function getMobileEnvironment(): MobileEnvironment {
  const appEnv = appEnvironment(
    process.env.EXPO_PUBLIC_APP_ENV,
  );

  const releaseVersion =
    process.env.EXPO_PUBLIC_RELEASE_VERSION?.trim() || "1.0.0";

  const apiUrl = requireUrl(
    "EXPO_PUBLIC_API_URL",
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
      "http://localhost:3001/api/v1/capilot-mobile",
  );

  const solanaNetwork =
    process.env.EXPO_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
      ? "mainnet-beta"
      : "devnet";

  const solanaRpcUrl = requireUrl(
    "EXPO_PUBLIC_SOLANA_RPC_URL",
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL?.trim() ||
      (solanaNetwork === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com"),
  );

  const suiNetwork =
    process.env.EXPO_PUBLIC_SUI_NETWORK === "mainnet"
      ? "mainnet"
      : process.env.EXPO_PUBLIC_SUI_NETWORK === "devnet"
        ? "devnet"
        : "testnet";

  const suiRpcUrl = requireUrl(
    "EXPO_PUBLIC_SUI_RPC_URL",
    process.env.EXPO_PUBLIC_SUI_RPC_URL?.trim() ||
      `https://fullnode.${suiNetwork}.sui.io:443`,
  );

  if (
    appEnv === "production" &&
    /localhost|127\.0\.0\.1/.test(apiUrl)
  ) {
    throw new Error(
      "Production frontend may not use a localhost API URL.",
    );
  }

  return {
    appEnv,
    releaseVersion,
    apiUrl,

    solanaNetwork,
    solanaRpcUrl,
    token2022Program:
      process.env.EXPO_PUBLIC_TOKEN_2022_PROGRAM?.trim() ||
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    pwrcMint: optional(process.env.EXPO_PUBLIC_PWRC_MINT),
    usdcMint: optional(process.env.EXPO_PUBLIC_USDC_MINT),
    eurcMint: optional(process.env.EXPO_PUBLIC_EURC_MINT),

    suiNetwork,
    suiRpcUrl,

    features: {
      ai: boolean(process.env.EXPO_PUBLIC_ENABLE_AI, true),
      marketData: boolean(
        process.env.EXPO_PUBLIC_ENABLE_MARKET_DATA,
        true,
      ),
      notifications: boolean(
        process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS,
        true,
      ),
    },
  };
}

export const mobileEnv = getMobileEnvironment();
