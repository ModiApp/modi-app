import { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_IDENTIFIER = "com.ikeybenz.modiii";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Modi",
  slug: "modi",
  scheme: "modi",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./ui/assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  primaryColor: "#35654D",
  backgroundColor: "#35654D",
  owner: "ikeybenz",
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./ui/assets/images/adaptive-icon.png",
      backgroundColor: "#35654D",
    },
    edgeToEdgeEnabled: true,
    package: BUNDLE_IDENTIFIER,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./ui/assets/images/icon.png",
    build: {
      babel: {
        include: ["@expo/vector-icons"],
      },
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./ui/assets/images/splash-image.png",
        imageWidth: 200,
        resizeMode: "center",
        backgroundColor: "#35654D",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "1c48f7a3-d55e-4a9c-b077-1e421bbd5906",
    },
  },
});