import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_COOLDOWN_SECONDS = 60;

export function useResendCooldown() {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const expiresAtRef = useRef(0);

  useEffect(() => {
    if (!secondsRemaining) return undefined;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    }, 500);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const startCooldown = useCallback((seconds = DEFAULT_COOLDOWN_SECONDS) => {
    expiresAtRef.current = Date.now() + seconds * 1000;
    setSecondsRemaining(seconds);
  }, []);

  return {
    isCoolingDown: secondsRemaining > 0,
    secondsRemaining,
    startCooldown,
  };
}
