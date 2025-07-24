import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { colors } from "@/ui/styles";

const ScreenContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.screen}>
      <View style={styles.content}>{children}</View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.feltGreen,
  },
  screen: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 16,
    maxWidth: 1080,
  },
});

export default ScreenContainer;
