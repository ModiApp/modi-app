import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createContext, useContext, useState, useCallback } from 'react';

interface PushNotificationContextValue {
  pushToken: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  error: string | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  requestPermission: () => Promise<void>;
  isRequesting: boolean;
}

const PushNotificationContext = createContext<PushNotificationContextValue>({
  pushToken: null,
  platform: null,
  error: null,
  permissionStatus: 'unknown',
  requestPermission: async () => {},
  isRequesting: false,
});

export function usePushNotification() {
  return useContext(PushNotificationContext);
}

// Legacy alias for backwards compatibility
export function usePushToken() {
  const { pushToken } = useContext(PushNotificationContext);
  return { expoPushToken: pushToken };
}

/**
 * Provider that initializes push notifications for the app.
 * Must be placed inside AuthProvider since it needs the user ID.
 */
export function PushNotificationProvider({ children }: React.PropsWithChildren) {
  const { pushToken, platform, error, permissionStatus, requestPermission } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  
  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  }, [requestPermission]);
  
  return (
    <PushNotificationContext.Provider value={{ 
      pushToken, 
      platform, 
      error, 
      permissionStatus,
      requestPermission: handleRequestPermission,
      isRequesting,
    }}>
      {children}
    </PushNotificationContext.Provider>
  );
}
