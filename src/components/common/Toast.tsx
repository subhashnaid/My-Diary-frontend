import React, { useEffect } from 'react';
import { Icon } from '../../icons/Icon';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  duration?: number; // ms, default 4000
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'success',
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const iconName = type === 'success' ? 'saved' : type === 'error' ? 'close' : 'sparkle';

  return (
    <div className={`toast-container toast-${type}`} role="status">
      <div className="toast-content">
        <Icon name={iconName} size={18} className="toast-icon" aria-hidden="true" />
        <span className="toast-message">{message}</span>
        <button
          onClick={onClose}
          className="toast-close"
          aria-label="Close notification"
        >
          <Icon name="close" size={14} color="currentColor" aria-hidden="true" />
        </button>
      </div>
      <div
        className="toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};
