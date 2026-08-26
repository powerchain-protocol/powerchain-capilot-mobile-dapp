import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PowerChain Copilot",
  slug: "powerchain-copilot",
  scheme: "powerchain-copilot",
  version: "1.0.0",
  orientation: "default",
  userInterfaceStyle: "automatic",
  icon: "./assets/icons/app-icon-light-1024.png",

  ios: {
    supportsTablet: true,
    icon: {
      light: "./assets/icons/app-icon-light-1024.png",
      dark: "./assets/icons/app-icon-dark-1024.png",
      tinted: "./assets/icons/app-icon-tinted-1024.png"
    },
    bundleIdentifier: "ventures.powerchain.copilot",
    config: {
      usesNonExemptEncryption: false
    }
  },

  android: {
    package: "ventures.powerchain.copilot",
    adaptiveIcon: {
      foregroundImage: "./assets/icons/adaptive-foreground.png",
      backgroundColor: "#FFFFFF",
      monochromeImage: "./assets/icons/monochrome.png"
    }
  },

  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/icons/favicon.png"
  },

  plugins: [
    "expo-router",
    [
      "expo-secure-store",
      {
        "configureAndroidBackup": true,
        "faceIDPermission": "Allow PowerChain Copilot to use Face ID for secure account access."
      }
    ],
    [
      "expo-notifications",
      {
        "icon": "./assets/icons/notification-icon.png",
        "color": "#0B2F24",
        "defaultChannel": "powerchain"
      }
    ]
  ],

  splash: {
    image: "./assets/icons/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0B2F24"
  },

  experiments: {
    typedRoutes: true
  },

  extra: {
    releaseVersion: "1.0.0"
  }
};

export default config;
