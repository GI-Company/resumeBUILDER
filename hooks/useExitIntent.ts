import { useState, useEffect } from 'react';

interface UseExitIntentOptions {
  cookieName?: string;
  delay?: number;
}

export function useExitIntent(options: UseExitIntentOptions = {}) {
  const { cookieName = 'hasSeenExitIntent', delay = 0 } = options;
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    // Only run on the client
    if (typeof window === 'undefined') return;

    const hasSeen = localStorage.getItem(cookieName);
    if (hasSeen === 'true') return;

    let timeout: NodeJS.Timeout;
    const handleMouseLeave = (e: MouseEvent) => {
      // Check if mouse left from the top of the window
      if (e.clientY <= 0) {
        timeout = setTimeout(() => {
          setIsShowing(true);
          localStorage.setItem(cookieName, 'true');
        }, delay);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (timeout) clearTimeout(timeout);
    };
  }, [cookieName, delay]);

  const closeExitIntent = () => setIsShowing(false);

  return { isShowing, closeExitIntent };
}
