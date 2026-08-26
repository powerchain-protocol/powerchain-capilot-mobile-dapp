const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map([...BASE58_ALPHABET].map((char, index) => [char, index]));

function decodeBase58(value: string) {
  if (!value) return new Uint8Array();
  const bytes: number[] = [0];
  for (const char of value) {
    const digit = BASE58_MAP.get(char);
    if (digit === undefined) throw new Error(`Invalid base58 character in Solana public key: ${char}`);
    let carry = digit;
    for (let i = 0; i < bytes.length; i += 1) {
      const next = bytes[i] * 58 + carry;
      bytes[i] = next & 0xff;
      carry = next >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < value.length - 1 && value[i] === '1'; i += 1) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}

export function validateSolanaPublicKey(value: string, label: string, optional = false) {
  const trimmed = value.trim();
  if (!trimmed && optional) return '';
  if (!trimmed) throw new Error(`${label} is required.`);
  if (decodeBase58(trimmed).length !== 32) throw new Error(`${label} must decode to a 32-byte Solana public key.`);
  return trimmed;
}

function clean(value: string | undefined) { return value?.trim() || ''; }
function first(source: NodeJS.ProcessEnv, ...names: string[]) {
  for (const name of names) {
    const value = clean(source[name]);
    if (value) return value;
  }
  return '';
}
function mustEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  return value as T;
}

export const SOLANA_PROGRAM_DEFAULTS = Object.freeze({
  system: '11111111111111111111111111111111',
  splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  token2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  associatedToken: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  memo: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  computeBudget: 'ComputeBudget111111111111111111111111111111',
  metaplexTokenMetadata: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  metaplexCore: 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d',
  metaplexBubblegum: 'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY',
  metaplexCandyMachine: 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR',
  metaplexCandyGuard: 'Guard1JwRhJkVH6XZhzoYxeBVQe872VH6QggF4BWmS9g',
  metaplexTokenAuthRules: 'auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg',
});

export const PWRC_CANONICAL = Object.freeze({
  symbol: 'PWRC',
  mint: 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
  network: 'mainnet-beta',
  decimals: 9,
  tokenProgram: SOLANA_PROGRAM_DEFAULTS.token2022,
});

export function loadNetworkConfig(source: NodeJS.ProcessEnv = process.env) {
  const cluster = mustEnum(clean(source.SOLANA_NETWORK) || 'devnet', ['devnet', 'mainnet-beta'] as const, 'SOLANA_NETWORK');
  const provider = mustEnum(clean(source.SOLANA_RPC_PROVIDER) || 'auto', ['auto', 'public', 'helius', 'custom'] as const, 'SOLANA_RPC_PROVIDER');
  const publicDevnet = clean(source.SOLANA_RPC_DEVNET_URL) || 'https://api.devnet.solana.com';
  const publicMainnet = clean(source.SOLANA_RPC_MAINNET_URL) || 'https://api.mainnet-beta.solana.com';
  const explicitRpc = clean(source.SOLANA_RPC_URL); // Explicit override only; .env interpolation is not required.
  const heliusApiKey = clean(source.HELIUS_API_KEY);
  const explicitHelius = clean(source.HELIUS_RPC_URL);
  const derivedHelius = heliusApiKey
    ? `https://${cluster === 'devnet' ? 'devnet' : 'mainnet'}.helius-rpc.com/?api-key=${encodeURIComponent(heliusApiKey)}`
    : '';
  let resolvedProvider: 'public' | 'helius' | 'custom';
  let rpcUrl: string;
  if (provider === 'custom') {
    if (!explicitRpc) throw new Error('SOLANA_RPC_URL is required when SOLANA_RPC_PROVIDER=custom.');
    resolvedProvider = 'custom'; rpcUrl = explicitRpc;
  } else if (provider === 'helius') {
    rpcUrl = explicitHelius || derivedHelius;
    if (!rpcUrl) throw new Error('HELIUS_RPC_URL or HELIUS_API_KEY is required when SOLANA_RPC_PROVIDER=helius.');
    resolvedProvider = 'helius';
  } else if (provider === 'public') {
    resolvedProvider = 'public'; rpcUrl = cluster === 'devnet' ? publicDevnet : publicMainnet;
  } else if (explicitRpc) {
    resolvedProvider = 'custom'; rpcUrl = explicitRpc;
  } else if (explicitHelius || derivedHelius) {
    resolvedProvider = 'helius'; rpcUrl = explicitHelius || derivedHelius;
  } else {
    resolvedProvider = 'public'; rpcUrl = cluster === 'devnet' ? publicDevnet : publicMainnet;
  }

  const configuredCreditToken = clean(source.POWERCHAIN_CREDIT_TOKEN) || PWRC_CANONICAL.symbol;
  if (configuredCreditToken.toUpperCase() !== PWRC_CANONICAL.symbol) throw new Error('POWERCHAIN_CREDIT_TOKEN must be PWRC.');
  const configuredMintAliases = [clean(source.POWERCHAIN_MINT), clean(source.PWRC_MINT)].filter(Boolean);
  for (const mint of configuredMintAliases) {
    if (mint !== PWRC_CANONICAL.mint) throw new Error('POWERCHAIN_MINT/PWRC_MINT must match the canonical PWRC mint.');
  }
  const configuredCreditNetwork = clean(source.PWRC_CREDIT_NETWORK) || PWRC_CANONICAL.network;
  if (configuredCreditNetwork !== PWRC_CANONICAL.network) throw new Error('PWRC_CREDIT_NETWORK must be mainnet-beta.');

  const program = (envNames: string[], fallback: string, optional = false) => {
    const label = envNames[0] ?? 'SOLANA_PROGRAM_ID';
    return validateSolanaPublicKey(first(source, ...envNames) || fallback, label, optional);
  };

  const suiNetwork = mustEnum(clean(source.SUI_NETWORK) || 'devnet', ['devnet', 'testnet', 'mainnet'] as const, 'SUI_NETWORK');
  const legacySuiUrl = (name: string) => {
    const value = clean(source[name]);
    return /^https?:\/\//i.test(value) ? value : '';
  };
  const suiDefaults = {
    devnet: clean(source.SUI_RPC_DEVNET_URL) || legacySuiUrl('SUI_NETWORK_DEVNET') || 'https://fullnode.devnet.sui.io:443',
    testnet: clean(source.SUI_RPC_TESTNET_URL) || legacySuiUrl('SUI_NETWORK_TESTNET') || 'https://fullnode.testnet.sui.io:443',
    mainnet: clean(source.SUI_RPC_MAINNET_URL) || legacySuiUrl('SUI_NETWORK_MAINNET') || 'https://fullnode.mainnet.sui.io:443',
  };

  return Object.freeze({
    solana: {
      cluster,
      requestedProvider: provider,
      provider: resolvedProvider,
      rpcUrl,
      commitment: clean(source.SOLANA_COMMITMENT) || 'confirmed',
      heliusConfigured: Boolean(explicitHelius || heliusApiKey),
      pwrc: {
        symbol: PWRC_CANONICAL.symbol,
        mint: validateSolanaPublicKey(PWRC_CANONICAL.mint, 'PWRC_MINT'),
        network: PWRC_CANONICAL.network,
        decimals: PWRC_CANONICAL.decimals,
        tokenProgram: PWRC_CANONICAL.tokenProgram,
      },
      programs: {
        powerchain: validateSolanaPublicKey(clean(source.POWERCHAIN_PROGRAM_ID), 'POWERCHAIN_PROGRAM_ID', true),
        energyRwa: validateSolanaPublicKey(clean(source.POWERCHAIN_ENERGY_RWA_PROGRAM_ID), 'POWERCHAIN_ENERGY_RWA_PROGRAM_ID', true),
        system: program(['SOLANA_SYSTEM_PROGRAM_ID', 'SYSTEM_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.system),
        splToken: program(['SOLANA_TOKEN_PROGRAM_ID', 'SPL_TOKEN_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.splToken),
        token2022: program(['SOLANA_TOKEN_2022_PROGRAM_ID', 'TOKEN_2022_PROGRAM'], SOLANA_PROGRAM_DEFAULTS.token2022),
        associatedToken: program(['SOLANA_ASSOCIATED_TOKEN_PROGRAM_ID', 'ASSOCIATED_TOKEN_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.associatedToken),
        memo: program(['SOLANA_MEMO_PROGRAM_ID', 'MEMO_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.memo),
        computeBudget: program(['SOLANA_COMPUTE_BUDGET_PROGRAM_ID', 'COMPUTE_BUDGET_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.computeBudget),
        metaplex: {
          tokenMetadata: program(['METAPLEX_TOKEN_METADATA_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.metaplexTokenMetadata),
          core: program(['METAPLEX_CORE_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.metaplexCore),
          bubblegum: program(['METAPLEX_BUBBLEGUM_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.metaplexBubblegum),
          candyMachine: program(['METAPLEX_CANDY_MACHINE_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.metaplexCandyMachine),
          candyGuard: program(['METAPLEX_CANDY_GUARD_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.metaplexCandyGuard),
          tokenAuthRules: program(['METAPLEX_TOKEN_AUTH_RULES_PROGRAM_ID'], SOLANA_PROGRAM_DEFAULTS.metaplexTokenAuthRules),
        },
      },
    },
    sui: {
      network: suiNetwork,
      rpcUrl: clean(source.SUI_RPC_URL) || suiDefaults[suiNetwork],
    },
  });
}

export function sanitizedSolanaSystemView(config: ReturnType<typeof loadNetworkConfig>) {
  return {
    cluster: config.solana.cluster,
    rpcProvider: config.solana.provider,
    commitment: config.solana.commitment,
    heliusConfigured: config.solana.heliusConfigured,
    pwrc: config.solana.pwrc,
    powerchainPrograms: {
      powerchain: config.solana.programs.powerchain || null,
      energyRwa: config.solana.programs.energyRwa || null,
    },
    standardPrograms: {
      system: config.solana.programs.system,
      splToken: config.solana.programs.splToken,
      token2022: config.solana.programs.token2022,
      associatedToken: config.solana.programs.associatedToken,
      memo: config.solana.programs.memo,
      computeBudget: config.solana.programs.computeBudget,
    },
    metaplexPrograms: config.solana.programs.metaplex,
  };
}
