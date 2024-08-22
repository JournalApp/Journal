import { useState, useEffect } from 'react';

function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const updateIsOnline = () => {
    setIsOnline(navigator.onLine);
  };

  useEffect(() => {
    window.addEventListener('online', updateIsOnline);
    window.addEventListener('offline', updateIsOnline);
    return () => {
      window.removeEventListener('online', updateIsOnline);
      window.removeEventListener('offline', updateIsOnline);
    };
  });

  return isOnline;
}

export { useIsOnline };
