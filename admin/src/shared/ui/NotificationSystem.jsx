import { useState, useEffect } from 'react';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose addNotification globally
  useEffect(() => {
    window.addNotification = addNotification;
    return () => {
      delete window.addNotification;
    };
  }, []);

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationStyle(notification.type)} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-80 animate-fadeInUp`}
        >
          <span className="text-xl">{getNotificationIcon(notification.type)}</span>
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;