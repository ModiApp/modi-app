import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Extend Navigator for iOS Safari's non-standard standalone property
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const SHOWN_KEY = 'pwa-install-shown'; // Track if we've shown the prompt this session
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface PWAInstallState {
  /** Whether we can show the install prompt */
  canPrompt: boolean;
  /** Whether the device is iOS (needs manual instructions) */
  isIOS: boolean;
  /** Whether the PWA is already installed */
  isInstalled: boolean;
  /** Loading state while checking storage */
  isLoading: boolean;
  /** Whether the prompt is ready to be triggered (browser event received or iOS) */
  isReady: boolean;
  /** Trigger showing the install prompt UI */
  showPrompt: () => void;
  /** Trigger the native install prompt (Android/Chrome only) */
  triggerInstall: () => Promise<boolean>;
  /** Dismiss the prompt (remembers for 14 days) */
  dismiss: () => Promise<void>;
}

export function usePWAInstall(): PWAInstallState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsLoading(false);
      return;
    }

    // Check if already installed (standalone mode)
    const nav = navigator as NavigatorStandalone;
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || nav.standalone === true;
    setIsInstalled(standalone);
    
    if (standalone) {
      setIsLoading(false);
      return;
    }

    // Detect iOS Safari (MSStream check excludes IE11)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(iOS);

    // Check dismissal state
    AsyncStorage.getItem(DISMISS_KEY).then((dismissedAt) => {
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
          setIsDismissed(true);
        } else {
          setIsDismissed(false);
        }
      } else {
        setIsDismissed(false);
      }
      
      setIsLoading(false);
    });

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // Prevent mini-infobar
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShouldShow(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Show the prompt UI (called when user enters valid username)
  const showPrompt = useCallback(() => {
    if (Platform.OS !== 'web') return;
    console.log('[PWA Debug] showPrompt called, setting shouldShow=true');
    setShouldShow(true);
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'dismissed') {
        await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
        setIsDismissed(true);
      }

      setInstallPrompt(null);
      setShouldShow(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error triggering install prompt:', error);
      return false;
    }
  }, [installPrompt]);

  const dismiss = useCallback(async () => {
    await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
    setShouldShow(false);
  }, []);

  // Whether the prompt is ready (browser event received or iOS Safari)
  const isReady = installPrompt !== null || isIOS;

  // Whether install prompt can be shown
  // Show when: not installed, not dismissed, shouldShow triggered, and ready
  const canPrompt = !isInstalled && !isDismissed && shouldShow && isReady;
  
  console.log('[PWA Debug] usePWAInstall state:', { isInstalled, isDismissed, shouldShow, isReady, canPrompt, hasInstallPrompt: installPrompt !== null, isIOS });

  return {
    canPrompt,
    isIOS,
    isInstalled,
    isLoading,
    isReady,
    showPrompt,
    triggerInstall,
    dismiss,
  };
}
