// Thin native-capability helpers. Web app does NOT need to import these;
// they are opt-in for code paths that want better-than-web behavior on Android.
// All helpers gracefully fall back to web APIs when not running inside Capacitor.

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

export const isNative = Capacitor.isNativePlatform();
export const nativePlatform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

// ---- Geolocation ----
export async function getCurrentPosition(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  try {
    if (isNative) {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions({ permissions: ['location'] });
        if (req.location !== 'granted') return null;
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    }
    return await new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000 },
      );
    });
  } catch {
    return null;
  }
}

export function watchPosition(
  cb: (pos: { lat: number; lng: number; accuracy: number }) => void,
): () => void {
  if (isNative) {
    let watchId: string | null = null;
    Geolocation.watchPosition({ enableHighAccuracy: true }, (pos) => {
      if (pos) cb({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
    }).then((id) => { watchId = id; });
    return () => { if (watchId) Geolocation.clearWatch({ id: watchId }); };
  }
  if (!('geolocation' in navigator)) return () => {};
  const id = navigator.geolocation.watchPosition(
    (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
    () => {},
    { enableHighAccuracy: true },
  );
  return () => navigator.geolocation.clearWatch(id);
}

// ---- Native storage (preferred over localStorage on native for reliability) ----
export const nativeStorage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isNative) return Preferences.set({ key, value });
    localStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isNative) return Preferences.remove({ key });
    localStorage.removeItem(key);
  },
};

// ---- Network ----
export async function isOnline(): Promise<boolean> {
  if (isNative) {
    const s = await Network.getStatus();
    return s.connected;
  }
  return navigator.onLine;
}

// ---- App lifecycle: hardware back button ----
// Wire this up once near app root (optional). It pops history; exits on root.
export function installAndroidBackHandler(historyBack: () => boolean) {
  if (!isNative || nativePlatform !== 'android') return;
  App.addListener('backButton', () => {
    const handled = historyBack();
    if (!handled) App.exitApp();
  });
}

// ---- Status bar / splash bootstrap (optional one-shot at app start) ----
export async function configureNativeShell() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  } catch { /* ignore */ }
  try {
    await SplashScreen.hide();
  } catch { /* ignore */ }
}
