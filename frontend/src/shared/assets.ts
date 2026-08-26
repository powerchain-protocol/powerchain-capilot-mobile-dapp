/**
 * Semantic asset identifiers shared by screens. React Native `require()` calls
 * remain literal so Metro can statically resolve and bundle every source.
 */
export const APP_ASSETS = {
  brand: {
    logoGreen: require("../../assets/brand/logo-green.png"),
    logoDark: require("../../assets/brand/logo-dark.png"),
    logoWhite: require("../../assets/brand/logo-white.png"),
    markLight: require("../../assets/brand/mark-light-transparent.png"),
    markDark: require("../../assets/brand/mark-dark-transparent.png"),
  },
  icons: {
    app: require("../../assets/icons/icon-1024.png"),
    appLight: require("../../assets/icons/app-icon-light-1024.png"),
    appDark: require("../../assets/icons/app-icon-dark-1024.png"),
    appTinted: require("../../assets/icons/app-icon-tinted-1024.png"),
    notification: require("../../assets/icons/notification-icon.png"),
    splash: require("../../assets/icons/splash-icon.png"),
  },
  tokens: {
    pwrc: require("../../assets/tokens/pwrc.png"),
    pwrc128: require("../../assets/tokens/pwrc-128.png"),
    pwrc256: require("../../assets/tokens/pwrc-256.png"),
    pwrc512: require("../../assets/tokens/pwrc-512.png"),
  },
} as const;

/** Web/PWA paths mirror the bundled static public assets. */
export const APP_PUBLIC_ASSETS = {
  tokenPwrc: "/assets/tokens/pwrc.png",
  favicon: "/favicon.ico",
  pwa192: "/pwa/icon-192x192.png",
  pwa512: "/pwa/icon-512x512.png",
  pwaMaskable512: "/pwa/maskable-icon-512x512.png",
} as const;

export type AppAssetRegistry = typeof APP_ASSETS;
