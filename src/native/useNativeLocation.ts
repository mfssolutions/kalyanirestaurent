import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type LocationStatus = 'pending' | 'granted' | 'denied' | 'unsupported';

export interface NativeLocationState {
  status: LocationStatus;
  label: string | null;          // human-readable city/area
  coords: { lat: number; lng: number } | null;
  error: string | null;
  request: () => Promise<void>;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const d = await r.json();
    const a = d.address || {};
    const local = a.suburb || a.neighbourhood || a.village || a.town || a.city_district;
    const city = a.city || a.town || a.village || a.county;
    if (local && city) return `${local}, ${city}`;
    if (city) return city;
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

/**
 * Geolocation hook. On native (Android) uses the Capacitor Geolocation
 * plugin which triggers the OS permission prompt; on web falls back to
 * navigator.geolocation. Caller can re-trigger via `request()`.
 */
export function useNativeLocation(): NativeLocationState {
  const [status, setStatus] = useState<LocationStatus>('pending');
  const [label, setLabel] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = async () => {
    const native = Capacitor.isNativePlatform();
    try {
      if (native) {
        // Capacitor Geolocation handles Android runtime permission prompts.
        const perm = await Geolocation.checkPermissions();
        let granted = perm.location === 'granted' || perm.coarseLocation === 'granted';
        if (!granted) {
          const req = await Geolocation.requestPermissions({ permissions: ['location'] });
          granted = req.location === 'granted' || req.coarseLocation === 'granted';
        }
        if (!granted) {
          setStatus('denied');
          setError('Location permission denied');
          return;
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus('granted');
        const name = await reverseGeocode(c.lat, c.lng);
        setLabel(name);
      } else {
        if (!navigator.geolocation) {
          setStatus('unsupported');
          setError('Geolocation not supported');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(c);
            setStatus('granted');
            setLabel(await reverseGeocode(c.lat, c.lng));
          },
          (err) => {
            setStatus('denied');
            setError(err.message || 'Could not get location');
          },
          { enableHighAccuracy: true, timeout: 15000 },
        );
      }
    } catch (e) {
      setStatus('denied');
      setError((e as Error).message || 'Failed to fetch location');
    }
  };

  useEffect(() => {
    fetchPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, label, coords, error, request: fetchPosition };
}
