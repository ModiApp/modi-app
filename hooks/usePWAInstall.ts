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
const ENGAGEMENT_KEY = 'pwa-engagement-count';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MIN_ENGAGEMENT_COUNT = 2; // Show after 2+ games/lobbies

export interface PWAInstallState {
  /** Whether we can show the install prompt */
  canPrompt: boolean;
  /** Whether the device is iOS (needs manual instructions) */
  isIOS: boolean;
  /** Whether the PWA is already installed */
  isInstalled: boolean;
  /** Loading state while checking storage */
  isLoading: boolean;
  /** Trigger the native install prompt (Android/Chrome only) */
  triggerInstall: () => Promise<boolean>;
  /** Dismiss the prompt (remembers for 14 days) */
  dismiss: () => Promise<void>;
  /** Track user engagement (call when joining/creating games) */
  trackEngagement: () => Promise<void>;
}

export function usePWAInstall(): PWAInstallState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [hasEngagement, setHasEngagement] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    // Check dismissal state and engagement
    Promise.all([
      AsyncStorage.getItem(DISMISS_KEY),
      AsyncStorage.getItem(ENGAGEMENT_KEY),
    ]).then(([dismissedAt, engagementCount]) => {
      // Check if dismissed recently
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

      // Check engagement level
      const count = engagementCount ? parseInt(engagementCount, 10) : 0;
      setHasEngagement(count >= MIN_ENGAGEMENT_COUNT);
      
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
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
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
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error triggering install prompt:', error);
      return false;
    }
  }, [installPrompt]);

  const dismiss = useCallback(async () => {
    await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  const trackEngagement = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    
    try {
      const current = await AsyncStorage.getItem(ENGAGEMENT_KEY);
      const count = current ? parseInt(current, 10) : 0;
      const newCount = count + 1;
      await AsyncStorage.setItem(ENGAGEMENT_KEY, newCount.toString());
      
      if (newCount >= MIN_ENGAGEMENT_COUNT) {
        setHasEngagement(true);
      }
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }, []);

  // Whether install prompt can be shown
  // Show when: not installed, not dismissed, has engagement, and either has native prompt or is iOS
  const canPrompt = !isInstalled && !isDismissed && hasEngagement && (installPrompt !== null || isIOS);

  return {
    canPrompt,
    isIOS,
    isInstalled,
    isLoading,
    triggerInstall,
    dismiss,
    trackEngagement,
  };
}
