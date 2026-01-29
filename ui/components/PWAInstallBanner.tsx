import { usePWAInstall } from '@/hooks/usePWAInstall';
import { colors, spacing } from '@/ui/styles';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform } from 'react-native';

/**
 * A banner that prompts users to install the PWA.
 * - On Android/Chrome: Shows install button that triggers native prompt
 * - On iOS Safari: Shows instructions for "Add to Home Screen"
 * 
 * Only shows after user engagement (2+ games/lobbies joined/created)
 * and respects dismissal for 14 days.
 */
export function PWAInstallBanner() {
  const { canPrompt, isIOS, isInstalled, isLoading, triggerInstall, dismiss } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [opacity] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (canPrompt && !isLoading) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [canPrompt, isLoading]);

  const handleDismiss = async () => {
    // Animate out
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await dismiss();
    });
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    setIsInstalling(true);
    const success = await triggerInstall();
    setIsInstalling(false);

    if (success) {
      // Will auto-hide due to isInstalled changing
    }
  };

  // Don't render on native or when conditions not met
  if (Platform.OS !== 'web' || isLoading || !canPrompt || isInstalled) {
    return null;
  }

  // iOS Safari instructions view
  if (showIOSInstructions) {
    return (
      <Animated.View 
        style={[
          styles.container, 
          styles.iosContainer,
          { opacity, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="phone-portrait-outline" size={24} color={colors.gold} />
            <Text style={styles.title}>Add Modi to Home Screen</Text>
          </View>
          <Pressable onPress={handleDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        
        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Tap the <Text style={styles.highlight}>Share</Text> button{' '}
              <Ionicons name="share-outline" size={16} color={colors.gold} />
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Scroll down and tap{' '}
              <Text style={styles.highlight}>"Add to Home Screen"</Text>
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Tap <Text style={styles.highlight}>"Add"</Text> in the top right
            </Text>
          </View>
        </View>

        <Pressable style={styles.gotItButton} onPress={handleDismiss}>
          <Text style={styles.gotItText}>Got it!</Text>
        </Pressable>
      </Animated.View>
    );
  }

  // Standard install banner
  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="download-outline" size={24} color={colors.gold} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Install Modi</Text>
          <Text style={styles.subtitle}>
            Quick access & push notifications
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Pressable 
          style={styles.dismissButton} 
          onPress={handleDismiss}
          disabled={isInstalling}
        >
          <Text style={styles.dismissText}>Not Now</Text>
        </Pressable>
        <Pressable 
          style={[styles.installButton, isInstalling && styles.buttonDisabled]} 
          onPress={handleInstall}
          disabled={isInstalling}
        >
          <Text style={styles.installText}>
            {isInstalling ? 'Installing...' : 'Install'}
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
  iosContainer: {
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
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
  installButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  installText: {
    color: colors.darkGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  instructionsList: {
    gap: spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  highlight: {
    color: colors.gold,
    fontWeight: '600',
  },
  gotItButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  gotItText: {
    color: colors.darkGreen,
    fontSize: 14,
    fontWeight: '600',
  },
});
