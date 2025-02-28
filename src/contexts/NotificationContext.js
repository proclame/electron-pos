import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  let notificationCount = 0;

  const showNotification = useCallback((message, type = 'success') => {
    const id = Date.now() + '-' + notificationCount++;
    const newNotification = { id, message, type };

    setNotifications((currentNotifications) => [...currentNotifications, newNotification]);

    setTimeout(() => {
      setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.id !== id));
    }, 10_000);
  }, []);

  const hideNotification = useCallback((id) => {
    setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div style={styles.notificationContainer}>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => hideNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

const styles = {
  notificationContainer: {
    position: 'fixed',
    maxWidth: '300px',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 1000,
  },
};
