import { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_IDENTIFIER = "com.ikeybenz.modiii";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  platforms: ["ios", "android", "web"],
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
    themeColor: "#35654D",
    output: "static",
    favicon: "./ui/assets/images/icon.png",
    build: {
      babel: {
        include: ["@expo/vector-icons"],
      },
    },
  },
  plugins: [
    ["expo-router", { origin: "https://modi.app" }],
    [
      "expo-splash-screen",
      {
        image: "./ui/assets/images/splash-image.png",
        imageWidth: 200,
        resizeMode: "contain",
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
      projectId: "1ef6e6c9-0750-4576-b1ab-09ce59acba23",
    },
  },
});