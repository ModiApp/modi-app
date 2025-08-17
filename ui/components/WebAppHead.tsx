import { Asset } from "expo-asset";
import Head from "expo-router/head";

export function WebAppHead() {
  return (
    <Head>
      <title>Modi</title>
      <link
        rel="icon"
        href={Asset.fromModule(require("@/ui/assets/images/icon.png")).uri}
      />
      <link
        rel="apple-touch-icon"
        href={Asset.fromModule(require("@/ui/assets/images/icon.png")).uri}
      />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Modi" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#35654D" />
      <meta
        property="og:description"
        content="Play with friends, don't end up with the lowest card."
      />
      <meta
        property="og:image"
        content={Asset.fromModule(require("@/ui/assets/images/icon.png")).uri}
      />
      <meta property="og:title" content="Modi" />
      <meta property="og:url" content="https://modi.app" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Modi" />
      <meta property="og:locale" content="en_US" />
    </Head>
  );
}
