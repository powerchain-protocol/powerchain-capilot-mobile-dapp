import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PowerChain Copilot',
  slug: 'powerchain-capilot-mobile-dapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: '../../assets/icon-pack/masters/app-icon-1024.png',
  scheme: 'powerchain',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    ...config.ios,
    bundleIdentifier: 'energy.powerchain.copilot',
    icon: {
      light: '../../assets/icon-pack/masters/ios-light-1024.png',
      dark: '../../assets/icon-pack/masters/ios-dark-1024.png',
      tinted: '../../assets/icon-pack/masters/ios-tinted-1024.png',
    },
    supportsTablet: true,
  },
  android: {
    ...config.android,
    package: 'energy.powerchain.copilot',
    adaptiveIcon: {
      foregroundImage: '../../assets/icon-pack/android/adaptive/foreground.png',
      backgroundImage: '../../assets/icon-pack/android/adaptive/background.png',
      monochromeImage: '../../assets/icon-pack/android/adaptive/monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: true,
  },
  web: {
    ...config.web,
    output: 'static',
    favicon: '../../assets/icon-pack/web/icon-48.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F7F9F7',
        image: '../../assets/icon-pack/masters/brandmark-dark.png',
        imageWidth: 128,
        dark: {
          backgroundColor: '#06241B',
          image: '../../assets/icon-pack/masters/brandmark-light.png',
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: '../../assets/icon-pack/android/notification/notification-icon-96.png',
        color: '#0B6B3A',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  },
});
