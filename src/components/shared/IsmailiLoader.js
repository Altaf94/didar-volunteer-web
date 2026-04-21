import React from 'react';
import './IsmailiLoader.css';

// Placeholder logo - you'll need to add the actual logo
const IsmailiLoader = ({
  message = 'Loading...',
  subMessage = 'Please wait while we process your request',
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-content">
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
        </div>
        <p className="loader-message">{message}</p>
        <p className="loader-sub-message">{subMessage}</p>
      </div>
    </div>
  );
};

export default IsmailiLoader;
