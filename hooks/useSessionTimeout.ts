/**
 * useSessionTimeout - Hook for handling game session timeout gracefully
 * 
 * Instead of silently redirecting users, this hook manages the session state
 * and provides information for showing appropriate UI feedback.
 */
import { useConnection } from '@/providers/Connection';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SessionState = 
  | 'active'           // Game session is active and connected
  | 'reconnecting'     // Temporarily disconnected, trying to reconnect
  | 'expired'          // Session has expired (game deleted or permanent disconnect)
  | 'game-ended';      // Game ended normally (detected via game state)

export interface SessionTimeoutState {
  /** Current session state */
  sessionState: SessionState;
  /** Whether the session is still valid for play */
  isSessionValid: boolean;
  /** Reason for session ending (if applicable) */
  endReason: string | null;
  /** Whether rejoin might be possible */
  canAttemptRejoin: boolean;
  /** Game ID for potential rejoin */
  gameId: string | null;
  /** Mark session as expired with a reason */
  expireSession: (reason: string, canRejoin?: boolean) => void;
  /** Mark game as ended normally */
  markGameEnded: () => void;
  /** Reset to active state (e.g., after successful reconnect) */
  resetSession: () => void;
}

interface UseSessionTimeoutOptions {
  gameId: string;
  /** Called when session expires and navigation should happen */
  onSessionExpired?: () => void;
}

export function useSessionTimeout({ 
  gameId, 
  onSessionExpired 
}: UseSessionTimeoutOptions): SessionTimeoutState {
  const { connectionState, isConnected } = useConnection();
  const [sessionState, setSessionState] = useState<SessionState>('active');
  const [endReason, setEndReason] = useState<string | null>(null);
  const [canAttemptRejoin, setCanAttemptRejoin] = useState(false);
  
  // Track if we've already triggered the expired callback
  const hasTriggeredExpired = useRef(false);

  // Sync with connection state for reconnecting
  // Note: We intentionally access expireSession via ref pattern to avoid 
  // dependency array issues that could cause infinite loops
  useEffect(() => {
    if (sessionState === 'active' && connectionState === 'reconnecting') {
      setSessionState('reconnecting');
    } else if (sessionState === 'reconnecting' && connectionState === 'connected') {
      // Successfully reconnected
      setSessionState('active');
      setEndReason(null);
    } else if (sessionState === 'reconnecting' && connectionState === 'disconnected') {
      // Failed to reconnect after timeout
      setSessionState('expired');
      setEndReason('Connection lost. Unable to reconnect to the game.');
      setCanAttemptRejoin(true);
      
      // Trigger callback only once
      if (!hasTriggeredExpired.current && onSessionExpired) {
        hasTriggeredExpired.current = true;
        onSessionExpired();
      }
    }
  }, [connectionState, sessionState, onSessionExpired]);

  const expireSession = useCallback((reason: string, canRejoin = false) => {
    setSessionState('expired');
    setEndReason(reason);
    setCanAttemptRejoin(canRejoin);
    
    // Trigger callback only once
    if (!hasTriggeredExpired.current && onSessionExpired) {
      hasTriggeredExpired.current = true;
      onSessionExpired();
    }
  }, [onSessionExpired]);

  const markGameEnded = useCallback(() => {
    setSessionState('game-ended');
    setEndReason('The game has ended.');
    setCanAttemptRejoin(false);
  }, []);

  const resetSession = useCallback(() => {
    setSessionState('active');
    setEndReason(null);
    setCanAttemptRejoin(false);
    hasTriggeredExpired.current = false;
  }, []);

  return {
    sessionState,
    isSessionValid: sessionState === 'active' || sessionState === 'reconnecting',
    endReason,
    canAttemptRejoin,
    gameId,
    expireSession,
    markGameEnded,
    resetSession,
  };
}
