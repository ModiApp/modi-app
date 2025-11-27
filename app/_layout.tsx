import { AuthProvider } from "@/providers/Auth";
import { SplashScreenProvider } from "@/providers/SplashScreen";
import { UsernameProvider } from "@/providers/Username";
import { AlertBanner } from "@/ui/components/AlertBanner";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebAppHead } from "@/ui/components/WebAppHead";
import { colors } from "@/ui/styles";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <WebAppHead />
          <AuthProvider>
            <UsernameProvider>
              <SplashScreenProvider />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.feltGreen },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="join-lobby" />
                <Stack.Screen name="playground" />
                <Stack.Screen name="games/[gameId]" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </UsernameProvider>
          </AuthProvider>
          <AlertBanner />
          <StatusBar style="light" />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
