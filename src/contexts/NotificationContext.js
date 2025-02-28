import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  const showNotification = useCallback(
    (message, type = 'success') => {
      if (timeoutId) clearTimeout(timeoutId);

      setNotification({ message, type });

      const id = setTimeout(() => {
        setNotification(null);
      }, 3000);

      setTimeoutId(id);
    },
    [timeoutId],
  );

  const hideNotification = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    setNotification(null);
  }, [timeoutId]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
      )}
    </NotificationContext.Provider>
  );
}
