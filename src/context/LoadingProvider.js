import React, { useEffect, useState } from 'react';
import IsmailiLoader from '../components/shared/IsmailiLoader';
import loadingManager from '../services/loadingManager';

const LoadingProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // start intercepting fetch calls
    loadingManager.initFetchInterceptor();
    const unsub = loadingManager.subscribe((c) => setCount(c));
    return () => unsub();
  }, []);

  return (
    <>
      {children}
      <IsmailiLoader visible={count > 0} message="Processing request..." />
    </>
  );
};

export default LoadingProvider;
