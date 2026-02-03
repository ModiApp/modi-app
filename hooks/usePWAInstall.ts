import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Hook to manage PWA installation prompts.
 * 
 * - On Android/Desktop Chrome: Captures `beforeinstallprompt` event
 * - On iOS: Detects Safari and provides flag to show manual instructions
 * - Tracks dismissal state for 14 days
 * 
 * @example
 * const { canPrompt, isIOS, triggerInstall, dismiss } = usePWAInstall();
 * 
 * if (canPrompt) {
 *   // Show install banner
 *   if (isIOS) {
 *     // Show manual "Add to Home Screen" instructions
 *   } else {
 *     // Show button that calls triggerInstall()
 *   }
 * }
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(true); // Default true to avoid flash
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default true to avoid flash

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') return;

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone; // Safari-specific property
    setIsInstalled(standalone);
    if (standalone) return;

    // Detect iOS Safari
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check dismissal state
    AsyncStorage.getItem(DISMISS_KEY).then((value) => {
      if (value) {
        const dismissedAt = parseInt(value, 10);
        if (Date.now() - dismissedAt < DISMISS_DURATION_MS) {
          setIsDismissed(true);
          return;
        }
      }
      setIsDismissed(false);
    });

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // Prevent mini-infobar from showing
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the native install prompt (Android/Desktop Chrome only).
   * Returns true if user accepted, false if dismissed.
   */
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'dismissed') {
      await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
      setIsDismissed(true);
    }
    
    setInstallPrompt(null);
    return outcome === 'accepted';
  }, [installPrompt]);

  /**
   * Dismiss the install prompt for 14 days.
   */
  const dismiss = useCallback(async () => {
    await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  // Whether install prompt can be shown
  // For iOS: can show if not installed and not dismissed (will show manual instructions)
  // For others: can show only if we captured the beforeinstallprompt event
  const canPrompt = !isInstalled && !isDismissed && (installPrompt !== null || isIOS);

  return {
    /** Whether we can show an install prompt */
    canPrompt,
    /** Whether this is iOS (requires manual install instructions) */
    isIOS,
    /** Whether the app is already installed */
    isInstalled,
    /** Whether user has the native install prompt available */
    hasNativePrompt: installPrompt !== null,
    /** Trigger native install prompt (Android/Chrome only) */
    triggerInstall,
    /** Dismiss the prompt for 14 days */
    dismiss,
  };
}
