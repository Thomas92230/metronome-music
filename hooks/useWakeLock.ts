import { useEffect, useCallback, useRef } from 'react';

export function useWakeLock(isActive: boolean) {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && isActive) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error("Erreur Wake Lock:", err);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      requestWakeLock();
    } else {
      wakeLock.current?.release();
      wakeLock.current = null;
    }

    // Réactiver si l'onglet redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLock.current?.release();
    };
  }, [isActive, requestWakeLock]);
}