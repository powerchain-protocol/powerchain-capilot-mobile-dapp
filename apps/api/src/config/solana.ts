import { env } from "./env.js";

export function solanaProgramRegistry() {
  return {
    powerchain: {
      coreProgramId: env.POWERCHAIN_PROGRAM_ID || null,
      energyRwaProgramId: env.POWERCHAIN_ENERGY_RWA_PROGRAM_ID || null,
      marketProgramId: env.POWERCHAIN_MARKET_PROGRAM_ID || null,
      settlementProgramId: env.POWERCHAIN_SETTLEMENT_PROGRAM_ID || null,
      rewardsProgramId: env.POWERCHAIN_REWARDS_PROGRAM_ID || null,
      treasuryProgramId: env.POWERCHAIN_TREASURY_PROGRAM_ID || null,
      acpProgramId: env.POWERCHAIN_ACP_PROGRAM_ID || null,
      programAuthority: env.POWERCHAIN_PROGRAM_AUTHORITY || null,
      treasuryAddress: env.POWERCHAIN_TREASURY_ADDRESS || null,
    },
    standard: {
      systemProgram: env.SYSTEM_PROGRAM_ID,
      tokenProgram: env.SPL_TOKEN_PROGRAM_ID,
      token2022Program: env.TOKEN_2022_PROGRAM,
      associatedTokenProgram: env.ASSOCIATED_TOKEN_PROGRAM_ID,
      memoProgram: env.MEMO_PROGRAM_ID,
      computeBudgetProgram: env.COMPUTE_BUDGET_PROGRAM_ID,
    },
    metaplex: {
      tokenMetadataProgram: env.METAPLEX_TOKEN_METADATA_PROGRAM_ID,
      coreProgram: env.METAPLEX_CORE_PROGRAM_ID,
      bubblegumV2Program: env.METAPLEX_BUBBLEGUM_PROGRAM_ID,
      candyMachineProgram: env.METAPLEX_CANDY_MACHINE_PROGRAM_ID,
      candyGuardProgram: env.METAPLEX_CANDY_GUARD_PROGRAM_ID,
      tokenAuthRulesProgram: env.METAPLEX_TOKEN_AUTH_RULES_PROGRAM_ID,
      accountCompressionProgram: env.SOLANA_ACCOUNT_COMPRESSION_PROGRAM_ID,
      noopProgram: env.SOLANA_NOOP_PROGRAM_ID,
    },
  } as const;
}

export function sanitizedSolanaRuntime() {
  return {
    cluster: env.SOLANA_NETWORK,
    provider: env.SOLANA_RPC_PROVIDER_EFFECTIVE,
    commitment: env.SOLANA_COMMITMENT,
    websocketConfigured: Boolean(env.SOLANA_WS_URL),
    helius: {
      configured: Boolean(env.HELIUS_RPC_URL || env.HELIUS_API_KEY),
      dasEnabled: env.HELIUS_DAS_ENABLED,
      websocketConfigured: Boolean(env.HELIUS_WS_URL || env.HELIUS_API_KEY),
    },
    pwrc: {
      symbol: env.POWERCHAIN_CREDIT_TOKEN,
      network: env.PWRC_CREDIT_NETWORK,
      mint: env.POWERCHAIN_MINT,
      configured: Boolean(env.POWERCHAIN_MINT),
      decimals: env.PWRC_DECIMALS,
      tokenProgram: env.PWRC_TOKEN_PROGRAM_ID,
      messagePricePwrc: env.COPILOT_MESSAGE_PRICE_PWRC.toString(),
      messagePriceBaseUnits: env.COPILOT_MESSAGE_PRICE_BASE_UNITS,
      metadataModel: "token-2022-native-or-external-integration",
    },
    stablecoins: {
      usdcMint: env.USDC_MINT ?? null,
      eurcMint: env.EURC_MINT ?? null,
    },
    programs: solanaProgramRegistry(),
  } as const;
}
