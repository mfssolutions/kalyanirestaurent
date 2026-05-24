import { useEffect, useRef, useState } from 'react';
import { MapPin, Settings as SettingsIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { App as CapApp } from '@capacitor/app';
import './GpsGate.css';

/**
 * Mandatory GPS gate for the native (Android) build.
 *
 * Two-step UX: first tap triggers the Android runtime permission dialog.
 * If Android suppresses the dialog (because the user previously chose
 * "Don't ask again" / has "permanently denied" the permission), we surface
 * an "Open settings" deep link that lands the user on the app's permission
 * page so they can flip the toggle. When they return we re-check.
 */
export default function GpsGate() {
  const native = Capacitor.isNativePlatform();
  const [granted, setGranted] = useState<boolean | null>(native ? null : true);
  const [requesting, setRequesting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const settingsTriedRef = useRef(false);

  const check = async () => {
    if (!native) { setGranted(true); return; }
    try {
      const p = await Geolocation.checkPermissions();
      const ok = p.location === 'granted' || p.coarseLocation === 'granted';
      setGranted(ok);
      // Once we've been granted, no further work — gate hides.
    } catch {
      setGranted(false);
    }
  };

  useEffect(() => {
    check();
    if (!native) return;
    const sub = CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) check();
    });
    return () => { sub.then(h => h.remove()).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ask = async () => {
    setRequesting(true);
    setAttempted(true);
    try {
      // First: request both fine + coarse so Android shows the system prompt.
      const req = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation'],
      });
      let ok = req.location === 'granted' || req.coarseLocation === 'granted';

      // Fallback: some OEMs return 'prompt' without ever showing UI until you
      // actually request a location. Force-trigger by reading position.
      if (!ok) {
        try {
          await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 });
          const after = await Geolocation.checkPermissions();
          ok = after.location === 'granted' || after.coarseLocation === 'granted';
        } catch { /* swallow */ }
      }
      setGranted(ok);
    } catch {
      setGranted(false);
    } finally {
      setRequesting(false);
    }
  };

  // Deep-link into the app's permission page in Android Settings.
  // Uses an Android intent: URL which the WebView resolves natively.
  const openAndroidSettings = () => {
    settingsTriedRef.current = true;
    const pkg = 'com.kalyanikitchen.app';
    const url = `intent://settings#Intent;scheme=package;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=${pkg};end`;
    try {
      window.location.href = url;
    } catch {
      // last-ditch: open generic location settings
      window.location.href = 'intent://#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
    }
  };

  if (granted !== false) return null;

  return (
    <div className="gpsgate">
      <div className="gpsgate-card">
        <div className="gpsgate-icon"><MapPin size={36} strokeWidth={2.2} /></div>
        <h2 className="gpsgate-title">Location required</h2>
        <p className="gpsgate-text">
          Kalyani Kitchen needs your location to confirm delivery address and
          approve your order. Please enable GPS to continue.
        </p>
        <button className="gpsgate-btn" onClick={ask} disabled={requesting}>
          {requesting ? 'Requesting…' : 'Enable location'}
        </button>
        {attempted && (
          <button className="gpsgate-btn gpsgate-btn--secondary" onClick={openAndroidSettings}>
            <SettingsIcon size={16} /> Open app settings
          </button>
        )}
        <p className="gpsgate-hint">
          {attempted
            ? 'No prompt? Tap "Open app settings" → Permissions → Location → Allow only this time or While using the app.'
            : 'If you previously denied permission, open device Settings → Apps → Kalyani Kitchen → Permissions → Location and allow it.'}
        </p>
      </div>
    </div>
  );
}

