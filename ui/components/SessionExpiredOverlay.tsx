/**
 * SessionExpiredOverlay - Shows when a game session expires
 * 
 * Provides clear feedback about why the session ended and options
 * for rejoining (if available) or going back home.
 */
import { useJoinLobby } from '@/hooks/useJoinLobby';
import { SessionTimeoutState } from '@/hooks/useSessionTimeout';
import { Container, Icon, Text } from '@/ui/elements';
import { colors, spacing } from '@/ui/styles';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

interface SessionExpiredOverlayProps {
  session: SessionTimeoutState;
  visible: boolean;
}

export function SessionExpiredOverlay({ 
  session,
  visible,
}: SessionExpiredOverlayProps) {
  const router = useRouter();
  const { joinLobby, isJoining } = useJoinLobby();
  const [rejoinAttempted, setRejoinAttempted] = useState(false);

  const handleGoHome = () => {
    router.replace('/');
  };

  const handleRejoin = async () => {
    if (!session.gameId || isJoining) return;
    
    setRejoinAttempted(true);
    const result = await joinLobby(session.gameId);
    
    if (result.success) {
      // Successfully rejoined - session will reset via useGame
      session.resetSession();
    }
    // If failed, useJoinLobby already shows an error alert
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon 
              name="alert-circle" 
              size={48} 
              color={colors.warningYellow} 
            />
          </View>

          {/* Title */}
          <Text 
            style={styles.title}
            color="darkText"
            fontFamily="primary"
          >
            Session Ended
          </Text>

          {/* Message */}
          <Text 
            style={styles.message}
            color="lightText"
          >
            {session.endReason || 'Your game session has ended.'}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            {session.canAttemptRejoin && session.gameId && (
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={handleRejoin}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Icon name="refresh" size={20} color={colors.white} />
                    <Text style={styles.buttonText} color="white">
                      {rejoinAttempted ? 'Try Again' : 'Rejoin Game'}
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGoHome}
              disabled={isJoining}
            >
              <Icon name="home" size={20} color={colors.feltGreen} />
              <Text style={[styles.buttonText, { color: colors.feltGreen }]}>
                Go Home
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.feltGreen,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.feltGreen,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
