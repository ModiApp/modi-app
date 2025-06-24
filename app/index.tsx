import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { isFirebaseConfigured } from "@/config/firebase";
import { useConnectionTracker } from "@/hooks/useConnectionTracker";
import { StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { connectionCount, connectionId } = useConnectionTracker();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Live Connection Counter
        </ThemedText>

        {!isFirebaseConfigured && (
          <View style={styles.warningContainer}>
            <ThemedText style={styles.warningText}>
              ⚠️ Firebase not configured
            </ThemedText>
            <ThemedText style={styles.warningSubtext}>
              See FIREBASE_SETUP.md for setup instructions
            </ThemedText>
          </View>
        )}

        <View style={styles.connectionInfo}>
          <ThemedText style={styles.connectionCount}>
            {connectionCount}
          </ThemedText>
          <ThemedText style={styles.connectionLabel}>
            {connectionCount === 1 ? "person" : "people"} connected
          </ThemedText>
        </View>

        <ThemedText style={styles.subtitle}>
          {isFirebaseConfigured
            ? "Open this app in multiple browsers to see the count increase!"
            : "Configure Firebase to enable real-time connection tracking"}
        </ThemedText>

        {connectionId && isFirebaseConfigured && (
          <ThemedText style={styles.connectionId}>
            Your connection ID: {connectionId.slice(-8)}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 32,
    textAlign: "center",
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  warningText: {
    color: "#856404",
    fontWeight: "bold",
    marginBottom: 4,
  },
  warningSubtext: {
    color: "#856404",
    fontSize: 12,
    textAlign: "center",
  },
  connectionInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  connectionCount: {
    fontSize: 72,
    fontWeight: "bold",
    marginBottom: 8,
  },
  connectionLabel: {
    fontSize: 18,
    opacity: 0.7,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 16,
  },
  connectionId: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: "center",
  },
});
