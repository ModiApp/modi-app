import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createContext, useContext } from 'react';

interface PushNotificationContextValue {
  expoPushToken: string | null;
}

const PushNotificationContext = createContext<PushNotificationContextValue>({
  expoPushToken: null,
});

export function usePushToken() {
  return useContext(PushNotificationContext);
}

/**
 * Provider that initializes push notifications for the app.
 * Must be placed inside AuthProvider since it needs the user ID.
 */
export function PushNotificationProvider({ children }: React.PropsWithChildren) {
  const { expoPushToken } = usePushNotifications();
  
  return (
    <PushNotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </PushNotificationContext.Provider>
  );
}
