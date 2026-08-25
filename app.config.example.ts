import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PowerChain Copilot",
  slug: "powerchain-copilot",
  scheme: "powerchain-copilot",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icons/icon.png",

  ios: {
    supportsTablet: true,
    icon: "./assets/icons/ios-icon.png",
    bundleIdentifier: "ventures.powerchain.copilot",
    config: {
      usesNonExemptEncryption: false
    }
  },

  android: {
    package: "ventures.powerchain.copilot",
    adaptiveIcon: {
      foregroundImage: "./assets/icons/adaptive-foreground.png",
      backgroundColor: "#123D2C",
      monochromeImage: "./assets/icons/monochrome.png"
    }
  },

  web: {
    favicon: "./assets/icons/favicon.png"
  },

  plugins: [
    "expo-router",
    [
      "expo-secure-store",
      {
        "configureAndroidBackup": true,
        "faceIDPermission": "Allow PowerChain Copilot to access Face ID for secure account access."
      }
    ],
    [
      "expo-notifications",
      {
        "icon": "./assets/icons/monochrome.png",
        "color": "#123D2C",
        "defaultChannel": "powerchain"
      }
    ]
  ],

  splash: {
    image: "./assets/icons/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#123D2C"
  },

  experiments: {
    typedRoutes: true
  },

  extra: {
    releaseVersion: "1.0.0"
  }
};

export default config;
