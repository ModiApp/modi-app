import { AuthProvider } from "@/providers/Auth";
import { UsernameProvider } from "@/providers/Username";
import { AlertBanner } from "@/ui/components/AlertBanner";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <AuthProvider>
      <UsernameProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="join-lobby" />
          <Stack.Screen name="playground" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <AlertBanner />
        <StatusBar style="auto" />
      </UsernameProvider>
    </AuthProvider>
  );
}
