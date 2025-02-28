import React from 'react';

function Notification({ message, type, onClose }) {
  return (
    <div style={styles.notification(type)}>
      <span>{message}</span>
      <button onClick={onClose} style={styles.closeButton}>
        ×
      </button>
    </div>
  );
}

const styles = {
  notification: (type) => ({
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    backgroundColor: type === 'error' ? '#dc3545' : '#28a745',
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out',
  }),
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
  },
};

export default Notification;
