const MAINNET_PWRC_MINT = "PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type MobileEnvironment = {
  appEnv: "development" | "preview" | "production";
  appName: string;
  releaseVersion: string;
  apiUrl: string;
  network: "devnet" | "mainnet-beta";
  dataMode: "demo" | "live" | "tba";
  aiMode: "managed" | "disabled";
  solanaNetwork: "devnet" | "mainnet-beta";
  solanaRpcUrl: string;
  solanaMainnetRpcUrl: string;
  token2022Program: string;
  powerchainProgramId?: string;
  powerchainEnergyRwaProgramId?: string;
  creditToken: "PWRC";
  creditNetwork: "devnet" | "mainnet-beta";
  pwrcMint?: string;
  pwrcMainnetMint: string;
  pwrcDevnetMint?: string;
  usdcMint?: string;
  eurcMint?: string;
  suiNetwork: "devnet" | "testnet" | "mainnet";
  suiRpcUrl: string;
  features: { ai: boolean; marketData: boolean; notifications: boolean };
};

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}
function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
function boolean(value: string | undefined, fallback: boolean) {
  if (value == null || value === "") return fallback;
  return value === "true";
}
function requireUrl(name: string, value: string) {
  try { new URL(value); } catch { throw new Error(`${name} must be a valid URL.`); }
  return normalizeUrl(value);
}
function appEnvironment(value: string | undefined): MobileEnvironment["appEnv"] {
  if (value === "production" || value === "preview") return value;
  return "development";
}
function network(value: string | undefined): "devnet" | "mainnet-beta" {
  return value === "mainnet-beta" ? "mainnet-beta" : "devnet";
}

export function getMobileEnvironment(): MobileEnvironment {
  const appEnv = appEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
  const releaseVersion = process.env.EXPO_PUBLIC_RELEASE_VERSION?.trim() || process.env.EXPO_PUBLIC_APP_VERSION?.trim() || "1.0.0";
  const appName = process.env.EXPO_PUBLIC_APP_NAME?.trim() || "PowerChain Copilot";
  const apiUrl = requireUrl("EXPO_PUBLIC_API_URL", process.env.EXPO_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000/api/v1");
  const selectedNetwork = network(process.env.EXPO_PUBLIC_NETWORK || process.env.EXPO_PUBLIC_SOLANA_NETWORK);
  const solanaNetwork = network(process.env.EXPO_PUBLIC_SOLANA_NETWORK || process.env.EXPO_PUBLIC_NETWORK);
  const solanaRpcUrl = requireUrl(
    "EXPO_PUBLIC_SOLANA_RPC_URL",
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL?.trim() || (solanaNetwork === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com"),
  );
  const solanaMainnetRpcUrl = requireUrl("EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL", process.env.EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com");
  const creditNetwork = network(process.env.EXPO_PUBLIC_CREDIT_NETWORK || process.env.EXPO_PUBLIC_SOLANA_NETWORK || process.env.EXPO_PUBLIC_NETWORK);
  const pwrcMainnetMint = process.env.EXPO_PUBLIC_PWRC_MINT_MAINNET?.trim() || MAINNET_PWRC_MINT;
  const pwrcDevnetMint = optional(process.env.EXPO_PUBLIC_PWRC_MINT_DEVNET);
  const explicitMint = optional(process.env.EXPO_PUBLIC_PWRC_MINT);
  const selectedMint = explicitMint ?? (creditNetwork === "mainnet-beta" ? pwrcMainnetMint : pwrcDevnetMint);

  if (creditNetwork === "mainnet-beta" && pwrcMainnetMint !== MAINNET_PWRC_MINT) {
    throw new Error("Mainnet PWRC must use the canonical PowerChain mint.");
  }
  if (explicitMint && creditNetwork === "devnet" && explicitMint === MAINNET_PWRC_MINT) {
    throw new Error("Devnet may not implicitly use the mainnet PWRC mint. Configure EXPO_PUBLIC_PWRC_MINT_DEVNET or leave the mint unset.");
  }
  if (appEnv === "production" && /localhost|127\.0\.0\.1/.test(apiUrl)) {
    throw new Error("Production frontend may not use a localhost API URL.");
  }

  const suiNetwork = process.env.EXPO_PUBLIC_SUI_NETWORK === "mainnet" ? "mainnet" : process.env.EXPO_PUBLIC_SUI_NETWORK === "testnet" ? "testnet" : "devnet";
  const suiRpcUrl = requireUrl("EXPO_PUBLIC_SUI_RPC_URL", process.env.EXPO_PUBLIC_SUI_RPC_URL?.trim() || `https://fullnode.${suiNetwork}.sui.io:443`);
  const dataMode = process.env.EXPO_PUBLIC_DATA_MODE === "live" ? "live" : process.env.EXPO_PUBLIC_DATA_MODE === "tba" ? "tba" : "demo";
  const aiMode = process.env.EXPO_PUBLIC_AI_MODE === "disabled" ? "disabled" : "managed";

  return {
    appEnv,
    appName,
    releaseVersion,
    apiUrl,
    network: selectedNetwork,
    dataMode,
    aiMode,
    solanaNetwork,
    solanaRpcUrl,
    solanaMainnetRpcUrl,
    token2022Program: process.env.EXPO_PUBLIC_TOKEN_2022_PROGRAM?.trim() || TOKEN_2022_PROGRAM,
    powerchainProgramId: optional(process.env.EXPO_PUBLIC_POWERCHAIN_PROGRAM_ID),
    powerchainEnergyRwaProgramId: optional(process.env.EXPO_PUBLIC_POWERCHAIN_ENERGY_RWA_PROGRAM_ID),
    creditToken: "PWRC",
    creditNetwork,
    pwrcMint: selectedMint,
    pwrcMainnetMint,
    pwrcDevnetMint,
    usdcMint: optional(process.env.EXPO_PUBLIC_USDC_MINT),
    eurcMint: optional(process.env.EXPO_PUBLIC_EURC_MINT),
    suiNetwork,
    suiRpcUrl,
    features: {
      ai: aiMode !== "disabled" && boolean(process.env.EXPO_PUBLIC_ENABLE_AI, true),
      marketData: boolean(process.env.EXPO_PUBLIC_ENABLE_MARKET_DATA, true),
      notifications: boolean(process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS, true),
    },
  };
}

export const mobileEnv = getMobileEnvironment();
