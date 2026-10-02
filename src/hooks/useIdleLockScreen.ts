import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleLockScreenOptions {
  timeoutMs?: number; // Default 5 minutes (300,000 ms)
  onLock?: () => void;
  onUnlock?: () => void;
}

export function useIdleLockScreen({
  timeoutMs = 5 * 60 * 1000, // 5 minutes
  onLock,
  onUnlock,
}: UseIdleLockScreenOptions = {}) {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('learning_os_is_locked') === 'true';
    } catch {
      return false;
    }
  });

  const lastActiveRef = useRef<number>(Date.now());
  const hiddenSinceRef = useRef<number | null>(null);
  const [secondsUntilLock, setSecondsUntilLock] = useState<number>(Math.floor(timeoutMs / 1000));

  const lock = useCallback(() => {
    setIsLocked(true);
    try {
      localStorage.setItem('learning_os_is_locked', 'true');
    } catch {}
    if (onLock) onLock();
  }, [onLock]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    lastActiveRef.current = Date.now();
    hiddenSinceRef.current = null;
    try {
      localStorage.removeItem('learning_os_is_locked');
    } catch {}
    if (onUnlock) onUnlock();
  }, [onUnlock]);

  const registerActivity = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  useEffect(() => {
    // Activity event listeners
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'wheel',
      'touchstart',
      'pointermove',
    ];

    const handleUserActivity = () => {
      if (!isLocked) {
        lastActiveRef.current = Date.now();
      }
    };

    // Tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenSinceRef.current = Date.now();
      } else {
        // Tab became visible again: check if it was hidden for >= timeout
        if (hiddenSinceRef.current && Date.now() - hiddenSinceRef.current >= timeoutMs) {
          lock();
        } else if (Date.now() - lastActiveRef.current >= timeoutMs) {
          lock();
        }
        hiddenSinceRef.current = null;
        lastActiveRef.current = Date.now();
      }
    };

    // Window blur & focus
    const handleWindowBlur = () => {
      if (!hiddenSinceRef.current) {
        hiddenSinceRef.current = Date.now();
      }
    };

    const handleWindowFocus = () => {
      if (hiddenSinceRef.current && Date.now() - hiddenSinceRef.current >= timeoutMs) {
        lock();
      } else if (Date.now() - lastActiveRef.current >= timeoutMs) {
        lock();
      }
      hiddenSinceRef.current = null;
      lastActiveRef.current = Date.now();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Periodic check every 5 seconds without triggering re-render unless locking
    const interval = setInterval(() => {
      if (isLocked) return;

      const now = Date.now();
      const idleTime = now - lastActiveRef.current;
      const hiddenTime = hiddenSinceRef.current ? now - hiddenSinceRef.current : 0;

      const maxIdle = Math.max(idleTime, hiddenTime);

      if (maxIdle >= timeoutMs) {
        lock();
      }
    }, 5000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(interval);
    };
  }, [isLocked, timeoutMs, lock]);

  return {
    isLocked,
    lock,
    unlock,
    registerActivity,
    secondsUntilLock,
    timeoutMs,
  };
}
