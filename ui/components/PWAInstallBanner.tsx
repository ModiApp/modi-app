import { colors, spacing } from '@/ui/styles';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { usePWAInstall } from '@/hooks/usePWAInstall';

/**
 * A banner that prompts users to install the PWA.
 * 
 * - On Android/Desktop Chrome: Shows "Install" button that triggers native prompt
 * - On iOS Safari: Shows manual instructions for "Add to Home Screen"
 * 
 * Shows only when:
 * - Running on web platform
 * - App is not already installed
 * - User hasn't dismissed it in the last 14 days
 */
export function PWAInstallBanner() {
  const { canPrompt, isIOS, triggerInstall, dismiss } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [opacity] = useState(new Animated.Value(0));

  // Animate in when canPrompt becomes true
  useEffect(() => {
    if (canPrompt) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [canPrompt, opacity]);

  const handleDismiss = async () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      await dismiss();
    });
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const accepted = await triggerInstall();
      if (!accepted) {
        // User dismissed the native prompt - our hook handles the 14-day cooldown
      }
    }
  };

  // Don't render on non-web platforms
  if (Platform.OS !== 'web') {
    return null;
  }

  // Don't show if conditions aren't met
  if (!canPrompt) {
    return null;
  }

  // iOS: Show manual instructions
  if (showIOSInstructions) {
    return (
      <Animated.View style={[styles.container, { opacity }]}>
        <View style={styles.content}>
          <Ionicons name="phone-portrait-outline" size={24} color={colors.gold} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Add Modi to Home Screen</Text>
            <Text style={styles.subtitle}>
              Follow these steps:
            </Text>
          </View>
        </View>
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>1.</Text>
            <Text style={styles.instructionText}>
              Tap the Share button <Ionicons name="share-outline" size={16} color={colors.white} />
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>2.</Text>
            <Text style={styles.instructionText}>
              Scroll and tap &quot;Add to Home Screen&quot;
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>3.</Text>
            <Text style={styles.instructionText}>
              Tap &quot;Add&quot; in the top right
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.enableButton} onPress={handleDismiss}>
            <Text style={styles.enableText}>Got it!</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // Default: Show install prompt
  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <Ionicons name="phone-portrait-outline" size={24} color={colors.gold} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Install Modi</Text>
          <Text style={styles.subtitle}>
            Quick access & push notifications from your home screen
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissText}>Not now</Text>
        </Pressable>
        <Pressable style={styles.enableButton} onPress={handleInstall}>
          <Text style={styles.enableText}>
            {isIOS ? 'Show me how' : 'Install'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGreen,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  instructionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  instructionNumber: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    width: 20,
  },
  instructionText: {
    color: colors.white,
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  enableButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  enableText: {
    color: colors.darkGreen,
    fontSize: 14,
    fontWeight: '600',
  },
});
