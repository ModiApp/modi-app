import { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

/**
 * iOS Safari PWA standalone mode doesn't respect env(safe-area-inset-bottom).
 * This component detects standalone mode and adds explicit bottom padding.
 */
export function SafeAreaBottomPadding() {
  const [isIOSStandalone, setIsIOSStandalone] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // navigator.standalone is iOS Safari specific - true when running as PWA
      const standalone = (window.navigator as any).standalone === true;
      setIsIOSStandalone(standalone);
      
      if (standalone) {
        console.log('[SafeArea] iOS standalone PWA detected, adding bottom padding');
      }
    }
  }, []);

  if (!isIOSStandalone) return null;

  // 34px is the home indicator height on modern iPhones (iPhone X and later)
  return <View style={styles.padding} />;
}

const styles = StyleSheet.create({
  padding: {
    height: 34,
    width: '100%',
  },
});
