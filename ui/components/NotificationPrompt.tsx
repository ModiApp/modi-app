import { usePushNotification } from '@/providers/PushNotifications';
import { colors, spacing } from '@/ui/styles';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_KEY = 'notification_prompt_dismissed';

/**
 * A banner that prompts users to enable push notifications.
 * Shows only when:
 * - Permission status is 'prompt' (not yet asked)
 * - User hasn't dismissed it
 * - We're on a supported platform
 */
export function NotificationPrompt() {
  const { permissionStatus, requestPermission, isRequesting, error, pushToken } = usePushNotification();
  const [dismissed, setDismissed] = useState(true); // Start hidden
  const [localError, setLocalError] = useState<string | null>(null);
  const [opacity] = useState(new Animated.Value(0));

  // Check if user previously dismissed the prompt
  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then(value => {
      if (value !== 'true' && permissionStatus === 'prompt') {
        setDismissed(false);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [permissionStatus]);

  // Auto-hide when we successfully get a token
  useEffect(() => {
    if (pushToken && !dismissed) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setDismissed(true));
    }
  }, [pushToken]);

  // Show error from context
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleDismiss = async () => {
    await AsyncStorage.setItem(DISMISSED_KEY, 'true');
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDismissed(true));
  };

  const handleEnable = async () => {
    setLocalError(null);
    try {
      await requestPermission();
      // Success/failure will be handled by useEffect watching pushToken/error
    } catch (err: any) {
      setLocalError(err.message || 'Failed to enable notifications');
    }
  };

  // Don't show if:
  // - Already granted (and no error)
  // - User dismissed it
  // Keep visible if there's an error so user can see it
  if (dismissed || (permissionStatus === 'granted' && !localError)) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <Ionicons name="notifications-outline" size={24} color={colors.gold} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.subtitle}>
            Get notified when it's your turn to play
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable 
          style={styles.dismissButton} 
          onPress={handleDismiss}
          disabled={isRequesting}
        >
          <Text style={styles.dismissText}>Later</Text>
        </Pressable>
        <Pressable 
          style={[styles.enableButton, isRequesting && styles.buttonDisabled]} 
          onPress={handleEnable}
          disabled={isRequesting}
        >
          <Text style={styles.enableText}>
            {isRequesting ? 'Enabling...' : 'Enable'}
          </Text>
        </Pressable>
      </View>
      {localError && (
        <Text style={styles.errorText}>{localError}</Text>
      )}
    </Animated.View>
  );
}

/**
 * Smaller inline button to enable notifications.
 * Use this in game lobbies or settings.
 */
export function NotificationButton() {
  const { permissionStatus, requestPermission, isRequesting, pushToken } = usePushNotification();
  
  if (permissionStatus === 'granted' && pushToken) {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="notifications" size={18} color={colors.success} />
        <Text style={styles.statusText}>Notifications enabled</Text>
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="notifications-off" size={18} color={colors.error} />
        <Text style={styles.statusTextDenied}>
          Notifications blocked. Enable in browser settings.
        </Text>
      </View>
    );
  }

  return (
    <Pressable 
      style={[styles.inlineButton, isRequesting && styles.buttonDisabled]} 
      onPress={requestPermission}
      disabled={isRequesting}
    >
      <Ionicons name="notifications-outline" size={18} color={colors.white} />
      <Text style={styles.inlineButtonText}>
        {isRequesting ? 'Enabling...' : 'Enable Notifications'}
      </Text>
    </Pressable>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  statusText: {
    color: colors.success,
    fontSize: 14,
  },
  statusTextDenied: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gold + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  inlineButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});
