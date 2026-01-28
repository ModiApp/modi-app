import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/ui/styles";
import { SafeAreaBottomPadding } from "@/ui/components/SafeAreaBottomPadding";

const ScreenContainer: React.FC<React.PropsWithChildren> = ({ children }) => {
  // On web, bottom safe area is handled via SafeAreaBottomPadding component
  // which detects iOS PWA standalone mode via navigator.standalone
  const edges = Platform.OS === 'web' 
    ? (['top', 'left', 'right'] as const)
    : (['top', 'bottom', 'left', 'right'] as const);
  
  return (
    <SafeAreaView style={styles.container} edges={edges}>
      <View style={styles.screen}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
      {Platform.OS === 'web' && <SafeAreaBottomPadding />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.feltGreen,
  },
  screen: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 16,
    maxWidth: 1080,
  },
});

export default ScreenContainer;
