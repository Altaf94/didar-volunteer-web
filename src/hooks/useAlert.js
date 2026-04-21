import { useState } from 'react';

export const useAlert = () => {
  const [alert, setAlert] = useState({
    type: 'info',
    title: '',
    message: '',
    isVisible: false,
  });

  const showAlert = (type, title, message) => {
    setAlert({
      type,
      title,
      message,
      isVisible: true,
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({
      ...prev,
      isVisible: false,
    }));
  };

  // Convenience methods
  const showError = (title, message) => showAlert('error', title, message);
  const showSuccess = (title, message) => showAlert('success', title, message);
  const showWarning = (title, message) => showAlert('warning', title, message);
  const showInfo = (title, message) => showAlert('info', title, message);

  return {
    alert,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
};
