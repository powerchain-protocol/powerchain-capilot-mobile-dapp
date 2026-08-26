export const MOBILE_API_PREFIX = "/api/v1/capilot-mobile" as const;
export const MOBILE_API_CORRECTED_ALIAS = "/api/v1/copilot-mobile" as const;
export const CORE_API_PREFIX = "/api/v1" as const;

const MOBILE_SAFE_ROOTS = new Set([
  "account",
  "twin",
  "sites",
  "iot",
  "flow",
  "exports",
  "events",
  "ems",
  "depin",
  "chat",
  "alarms",
  "actions",
  "ai",
  "auth",
  "config",
  "cors",
  "credits",
  "health",
  "integrations",
  "market",
  "mcp",
  "mpc",
  "lora",
  "llm",
  "onboarding",
  "solana",
  "sui",
  "system",
  "wallets",
]);

function splitUrl(rawUrl: string) {
  const queryIndex = rawUrl.indexOf("?");
  if (queryIndex === -1) {
    return { pathname: rawUrl, query: "" };
  }
  return {
    pathname: rawUrl.slice(0, queryIndex),
    query: rawUrl.slice(queryIndex),
  };
}

function normalizeTrailingSlash(pathname: string) {
  if (pathname.length <= 1) return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function rewriteMobileApiUrl(rawUrl: string): string {
  const { pathname: originalPathname, query } = splitUrl(rawUrl);
  const pathname = normalizeTrailingSlash(originalPathname);

  for (const prefix of [MOBILE_API_PREFIX, MOBILE_API_CORRECTED_ALIAS]) {
    if (pathname === prefix) {
      return `${prefix}${query}`;
    }

    if (!pathname.startsWith(`${prefix}/`)) continue;

    const rest = pathname.slice(prefix.length + 1);
    const firstSegment = rest.split("/", 1)[0] ?? "";

    // Mobile aliases are intentionally fail-closed. They expose only the
    // explicitly reviewed public/mobile roots above. In particular, a future
    // /api/v1/internal/* route cannot become mobile-accessible by accident.
    if (!MOBILE_SAFE_ROOTS.has(firstSegment)) {
      return `${pathname}${query}`;
    }

    const canonical = normalizeTrailingSlash(`${CORE_API_PREFIX}/${rest}`);
    return `${canonical}${query}`;
  }

  return rawUrl;
}

export function mobileApiMetadata() {
  return {
    primary: MOBILE_API_PREFIX,
    correctedAlias: MOBILE_API_CORRECTED_ALIAS,
    core: CORE_API_PREFIX,
    mobileSafeRoots: [...MOBILE_SAFE_ROOTS].sort(),
    internalRoutesMirrored: false,
  } as const;
}
