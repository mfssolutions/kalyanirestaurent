import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Countdown timer hook for OTP resend buttons.
 * Returns the remaining seconds and a `start()` function to (re)arm the timer.
 */
export function useResendTimer(seconds = 45) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setRemaining(seconds);
    intervalRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clear(); return 0; }
        return r - 1;
      });
    }, 1000);
  }, [seconds, clear]);

  useEffect(() => clear, [clear]);

  return { remaining, start, canResend: remaining === 0 };
}
