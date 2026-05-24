/**
 * Native-platform bootstrap. Imported eagerly so the body class flips before
 * React commits, preventing a flash of un-themed web UI inside the Android
 * shell. On the web build this is a no-op (Capacitor.isNativePlatform() is
 * false), so `native.css` rules never match.
 */
import { Capacitor } from '@capacitor/core';
import './native.css';

export function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  document.body.classList.add('kk-native');

  // Reflect the current route as a data attribute so the auth screens'
  // pure-CSS subtitle picks the right copy without any JSX changes.
  const syncPath = () => {
    document.body.setAttribute('data-path', window.location.pathname || '/');
  };
  syncPath();
  window.addEventListener('popstate', syncPath);

  // Patch pushState/replaceState so react-router navigations update the attr.
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = (...args: Parameters<typeof origPush>) => {
    origPush(...args);
    syncPath();
  };
  history.replaceState = (...args: Parameters<typeof origReplace>) => {
    origReplace(...args);
    syncPath();
  };
}
