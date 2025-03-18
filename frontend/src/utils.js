import { useEffect, useRef, useState } from 'react';

export const useInterval = (callback, delay) => {
  const callbackRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    };
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};
