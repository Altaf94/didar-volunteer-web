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
        <div className="loader-logo-flip">
          <img src="/ismaililogo.png" alt="Logo" className="flip-animation" style={{ width: 56, height: 56, borderRadius: 12 }} />
        </div>
        <p className="loader-message">{message}</p>
        <p className="loader-sub-message">{subMessage}</p>
      </div>
    </div>
  );
};

export default IsmailiLoader;
