import { Platform } from 'react-native';

/**
 * Check if web push notifications are supported in the current environment.
 * 
 * Web push is NOT supported on:
 * - Safari iOS in browser mode (only works as installed PWA on iOS 16.4+)
 * - Older browsers without Notification API
 * - Browsers without service worker support
 * 
 * @returns true if push notifications can work in this environment
 */
export function isPushNotificationSupported(): boolean {
  // Native platforms handle their own push support
  if (Platform.OS !== 'web') {
    return true;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Notification API
  if (!('Notification' in window)) {
    return false;
  }

  // Check for service worker support (required for web push)
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  // Detect iOS Safari (non-PWA)
  if (isIOSSafariNonPWA()) {
    return false;
  }

  return true;
}

/**
 * Detect if we're running in Safari on iOS but NOT as an installed PWA.
 * Safari iOS only supports web push when installed as a PWA (iOS 16.4+).
 */
function isIOSSafariNonPWA(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  
  // Check if iOS (iPhone, iPad, iPod)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad with desktop UA
  
  if (!isIOS) {
    return false;
  }

  // Check if running as installed PWA (standalone mode)
  // @ts-ignore - navigator.standalone is Safari-specific
  const isStandalone = window.navigator.standalone === true || 
    window.matchMedia('(display-mode: standalone)').matches;

  // If iOS but NOT standalone, push won't work
  return !isStandalone;
}
