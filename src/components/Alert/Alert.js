import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { colors } from '../../theme';
import './Alert.css';

const Alert = ({
  type = 'info',
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 15000,
}) => {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    setVisible(isVisible);
    
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: colors.error,
          textColor: colors.white,
          icon: <AlertCircle color={colors.white} size={20} />,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          textColor: colors.black,
          icon: <AlertTriangle color={colors.black} size={20} />,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          textColor: colors.white,
          icon: <CheckCircle color={colors.white} size={20} />,
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.info,
          textColor: colors.white,
          icon: <Info color={colors.white} size={20} />,
        };
    }
  };

  if (!isVisible) return null;

  const alertStyles = getStyles();

  return (
    <div
      className={`alert ${visible ? 'alert-visible' : 'alert-hidden'}`}
      style={{ backgroundColor: alertStyles.backgroundColor }}
    >
      <div className="alert-content">
        <div className="alert-icon">{alertStyles.icon}</div>
        <div className="alert-text">
          {title && (
            <div className="alert-title" style={{ color: alertStyles.textColor }}>
              {title}
            </div>
          )}
          <div className="alert-message" style={{ color: alertStyles.textColor }}>
            {message}
          </div>
        </div>
        <button
          className="alert-close"
          onClick={handleClose}
          style={{ color: alertStyles.textColor }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default Alert;
