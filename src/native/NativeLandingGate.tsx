import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import AndroidLanding from './AndroidLanding';

const SEEN_KEY = 'kk_native_landing_seen_v1';

/**
 * Native-only first-run landing gate.
 *
 * Behavior:
 *  - On web (browser): renders nothing → web app is 100 % unchanged.
 *  - On Android shell, first launch: shows the landing screen on top of the
 *    app until the user taps "Get Started" or "Login". Once dismissed the
 *    flag is persisted so subsequent app opens go straight to the real UI.
 */
export default function NativeLandingGate() {
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();
  const location = useLocation();

  const [show, setShow] = useState<boolean>(() => {
    if (!isNative) return false;
    try {
      return localStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });

  // Defensive: if we somehow render outside native, never show.
  useEffect(() => {
    if (!isNative && show) setShow(false);
  }, [isNative, show]);

  if (!isNative || !show) return null;

  // Only overlay at the app root — if the user navigated elsewhere (deep link,
  // back-stack restore, etc.) don't hijack the screen.
  if (location.pathname !== '/' && location.pathname !== '') return null;

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <AndroidLanding
      onGetStarted={() => { dismiss(); navigate('/signup'); }}
      onLogin={() => { dismiss(); navigate('/login'); }}
    />
  );
}
