import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { App as CapApp } from '@capacitor/app';
import './GpsGate.css';

/**
 * Mandatory GPS gate for the native (Android) build.
 * Renders a full-screen blocking overlay until the user grants location
 * permission. Re-checks permission whenever the app returns from background
 * so a Settings round-trip will dismiss the gate automatically.
 *
 * The web build never renders this (gated by Capacitor.isNativePlatform()).
 */
export default function GpsGate() {
  const native = Capacitor.isNativePlatform();
  const [granted, setGranted] = useState<boolean | null>(native ? null : true);
  const [requesting, setRequesting] = useState(false);

  const check = async () => {
    if (!native) { setGranted(true); return; }
    try {
      const p = await Geolocation.checkPermissions();
      setGranted(p.location === 'granted' || p.coarseLocation === 'granted');
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
    try {
      const req = await Geolocation.requestPermissions({ permissions: ['location'] });
      const ok = req.location === 'granted' || req.coarseLocation === 'granted';
      setGranted(ok);
    } catch {
      setGranted(false);
    } finally {
      setRequesting(false);
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
        <p className="gpsgate-hint">
          If you previously denied permission, open device Settings → Apps →
          Kalyani Kitchen → Permissions → Location and allow it.
        </p>
      </div>
    </div>
  );
}
