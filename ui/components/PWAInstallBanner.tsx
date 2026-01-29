import { usePWAInstall } from '@/hooks/usePWAInstall';
import { colors, spacing } from '@/ui/styles';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Animated, 
  Platform,
  Image,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ICON_SIZE = 64;

/**
 * A native-looking bottom sheet that prompts users to install the PWA.
 * 
 * Design inspired by Chrome's native install prompt and iOS system dialogs:
 * - Bottom sheet style (feels native on both platforms)
 * - Prominent app icon
 * - Clean typography hierarchy
 * - Native button styling
 * - Smooth spring animations
 * 
 * Behavior:
 * - On Android/Chrome: Shows install button that triggers native prompt
 * - On iOS Safari: Shows step-by-step Add to Home Screen instructions
 * - Only shows after user engagement (2+ games joined/created)
 * - Respects dismissal for 14 days
 */
export function PWAInstallBanner() {
  const { canPrompt, isIOS, isInstalled, isLoading, triggerInstall, dismiss } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (canPrompt && !isLoading) {
      // Animate in with staggered timing
      Animated.sequence([
        // First: fade in backdrop
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Then: slide up sheet with spring physics
        Animated.parallel([
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 250,
            delay: 50,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [canPrompt, isLoading]);

  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleDismiss = async () => {
    animateOut(async () => {
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

  const handleBackIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  // Don't render on native or when conditions not met
  if (Platform.OS !== 'web' || isLoading || !canPrompt || isInstalled) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Semi-transparent backdrop */}
      <Animated.View 
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <Pressable style={styles.backdropPressable} onPress={handleDismiss} />
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View 
        style={[
          styles.sheet,
          { 
            transform: [{ translateY: sheetTranslateY }],
          }
        ]}
      >
        {/* Drag indicator (visual only) */}
        <View style={styles.dragIndicator} />

        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {showIOSInstructions ? (
            <IOSInstructions 
              onBack={handleBackIOSInstructions}
              onDismiss={handleDismiss}
            />
          ) : (
            <InstallPrompt 
              isIOS={isIOS}
              isInstalling={isInstalling}
              onInstall={handleInstall}
              onDismiss={handleDismiss}
            />
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Main install prompt content
function InstallPrompt({ 
  isIOS, 
  isInstalling, 
  onInstall, 
  onDismiss 
}: {
  isIOS: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <>
      {/* App icon and info */}
      <View style={styles.appInfo}>
        <View style={styles.iconContainer}>
          <Image 
            source={{ uri: '/icon-192.png' }}
            style={styles.appIcon}
            resizeMode="cover"
          />
        </View>
        <View style={styles.appDetails}>
          <Text style={styles.appName}>Modi</Text>
          <Text style={styles.appTagline}>Card Game</Text>
        </View>
      </View>

      {/* Value proposition */}
      <View style={styles.features}>
        <FeatureItem 
          icon="flash-outline" 
          text="Instant access from home screen"
        />
        <FeatureItem 
          icon="notifications-outline" 
          text="Get notified when friends play"
        />
        <FeatureItem 
          icon="cloud-offline-outline" 
          text="Works offline"
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={[styles.installButton, isInstalling && styles.buttonDisabled]} 
          onPress={onInstall}
          disabled={isInstalling}
        >
          {isInstalling ? (
            <Text style={styles.installButtonText}>Installing...</Text>
          ) : (
            <>
              <Ionicons 
                name={isIOS ? "add-circle-outline" : "download-outline"} 
                size={20} 
                color={colors.darkGreen} 
                style={styles.buttonIcon}
              />
              <Text style={styles.installButtonText}>
                {isIOS ? 'Add to Home Screen' : 'Install App'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable 
          style={styles.dismissButton} 
          onPress={onDismiss}
          disabled={isInstalling}
        >
          <Text style={styles.dismissButtonText}>Not Now</Text>
        </Pressable>
      </View>
    </>
  );
}

// Feature list item
function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={18} color={colors.gold} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// iOS Safari instructions
function IOSInstructions({ 
  onBack, 
  onDismiss 
}: { 
  onBack: () => void;
  onDismiss: () => void;
}) {
  return (
    <>
      {/* Header with back button */}
      <View style={styles.iosHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <Text style={styles.iosHeaderTitle}>Add to Home Screen</Text>
        <View style={styles.backButton} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsList}>
        <InstructionStep 
          step={1}
          text="Tap the Share button in Safari"
          icon={
            <View style={styles.shareIconContainer}>
              <Ionicons name="share-outline" size={20} color="#007AFF" />
            </View>
          }
        />
        <InstructionStep 
          step={2}
          text="Scroll down and tap"
          highlight="Add to Home Screen"
          icon={
            <View style={styles.addIconContainer}>
              <Ionicons name="add-outline" size={16} color="#007AFF" />
            </View>
          }
        />
        <InstructionStep 
          step={3}
          text="Tap Add in the top right corner"
        />
      </View>

      {/* Done button */}
      <Pressable style={styles.doneButton} onPress={onDismiss}>
        <Text style={styles.doneButtonText}>Got It</Text>
      </Pressable>
    </>
  );
}

// Instruction step component
function InstructionStep({ 
  step, 
  text, 
  highlight,
  icon 
}: { 
  step: number; 
  text: string;
  highlight?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.instructionStep}>
      <View style={styles.stepNumberContainer}>
        <Text style={styles.stepNumber}>{step}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepText}>
          {text}
          {highlight && (
            <>
              {' '}
              <Text style={styles.stepHighlight}>{highlight}</Text>
            </>
          )}
        </Text>
        {icon}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.darkGreen,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for home indicator
    // Subtle shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },

  // App info section
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.feltGreen,
    // iOS-style app icon shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  appIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  appDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Features section
  features: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },

  // Action buttons
  actions: {
    gap: spacing.sm,
  },
  installButton: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  installButtonText: {
    color: colors.darkGreen,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },

  // iOS instructions
  iosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  instructionsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.darkGreen,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 4,
    gap: 6,
  },
  stepText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  stepHighlight: {
    color: colors.white,
    fontWeight: '600',
  },
  shareIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.darkGreen,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
