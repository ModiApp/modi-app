import { fontFamilies } from "@/ui/styles";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuth } from "./Auth";
import { useUsername } from "./Username";

// prevent splash screen from hiding itself automatically
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true });

/**
 *
 * This component doesn't wrap any children, it's just placed next to the screens in the root layout
 * so that it can have access to other providers to determine when to hide the splash screen.
 */
export function SplashScreenProvider() {
  const [fontsLoaded] = useFonts({
    [fontFamilies.primary]: require("../ui/assets/fonts/Chalkduster.ttf"),
  });

  const { isLoading: isUsernameLoading } = useUsername();
  const { isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (fontsLoaded && !isUsernameLoading && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isUsernameLoading, isAuthLoading]);

  return null;
}
