import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import type { Rider, Order } from '../types';
import { supabase } from '../lib/supabase';
import { sendPhoneOtp, resetRecaptcha, firebaseAuth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { toRider, toOrder } from '../lib/mappers';

interface RiderContextType {
  isRiderAuthenticated: boolean;
  rider: Rider | null;
  riderOtpSent: boolean;
  riderOrders: Order[];
  riderLogin: (phone: string) => Promise<{ success: boolean; error?: string }>;
  riderVerifyOtp: (otp: string, phone: string) => Promise<boolean>;
  riderLogout: () => void;
  toggleOnline: () => void;
  acceptDelivery: (orderId: string) => void;
  markPickedUp: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
  updateRiderLocation: (lat: number, lng: number) => void;
}

const RiderContext = createContext<RiderContextType | null>(null);

export const useRider = () => {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within RiderProvider');
  return ctx;
};

const RIDER_STORAGE_KEY = 'kalyani_rider';

export function RiderProvider({ children }: { children: ReactNode }) {
  const [isRiderAuthenticated, setIsRiderAuthenticated] = useState(false);
  const [rider, setRider] = useState<Rider | null>(null);
  const [riderOtpSent, setRiderOtpSent] = useState(false);
  const [riderOrders, setRiderOrders] = useState<Order[]>([]);

  // Validate rider session against Supabase on mount
  useEffect(() => {
    const saved = localStorage.getItem(RIDER_STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved) as Rider;
    // Verify rider still exists and is active
    supabase.from('riders').select('*').eq('id', parsed.id).eq('is_active', true).maybeSingle().then(({ data }) => {
      if (data) {
        const riderData = toRider(data);
        setRider(riderData);
        setIsRiderAuthenticated(true);
      } else {
        localStorage.removeItem(RIDER_STORAGE_KEY);
      }
    });
  }, []);

  // Persist rider to localStorage
  useEffect(() => {
    if (rider) {
      localStorage.setItem(RIDER_STORAGE_KEY, JSON.stringify(rider));
    } else {
      localStorage.removeItem(RIDER_STORAGE_KEY);
    }
  }, [rider]);

  // Fetch orders assigned to this rider + unassigned accepted orders
  useEffect(() => {
    if (!rider) return;

    const fetchOrders = () => {
      supabase
        .from('orders')
        .select('*')
        .in('status', ['accepted', 'preparing', 'out-for-delivery'])
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const orders = data.map(toOrder);
            // Show: orders assigned to this rider + unassigned accepted orders
            const filtered = orders.filter(
              o => o.riderId === rider.id || (!o.riderId && o.status === 'accepted')
            );
            setRiderOrders(filtered);
          }
        });
    };

    fetchOrders();

    const channel = supabase
      .channel('rider_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rider]);

  const riderConfirmationRef = useRef<ConfirmationResult | null>(null);
  const RIDER_RECAPTCHA = 'recaptcha-rider';

  // Login: check phone exists in riders table, then send Firebase OTP
  const riderLogin = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Not a registered rider. Contact admin.' };
    }

    try {
      const confirmation = await sendPhoneOtp(`+91${phone}`, RIDER_RECAPTCHA);
      riderConfirmationRef.current = confirmation;
      setRiderOtpSent(true);
      return { success: true };
    } catch (err) {
      resetRecaptcha(RIDER_RECAPTCHA);
      return { success: false, error: (err as Error).message || 'Failed to send OTP' };
    }
  }, []);

  // Verify OTP and log rider in
  const riderVerifyOtp = useCallback(async (otp: string, phone: string): Promise<boolean> => {
    if (!riderConfirmationRef.current) return false;
    try {
      await riderConfirmationRef.current.confirm(otp);
    } catch {
      return false;
    }

    // Fetch latest rider data
    const { data } = await supabase
      .from('riders')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (data) {
      const riderData = toRider(data);
      setRider(riderData);
      setIsRiderAuthenticated(true);
      setRiderOtpSent(false);
      riderConfirmationRef.current = null;

      // Auto set online
      await supabase.from('riders').update({ is_online: true }).eq('id', riderData.id);
      setRider(prev => prev ? { ...prev, isOnline: true } : null);
      return true;
    }
    return false;
  }, []);

  const riderLogout = useCallback(async () => {
    if (rider) {
      await supabase.from('riders').update({ is_online: false }).eq('id', rider.id)
        .then(({ error }) => { if (error) console.error('Rider offline update error:', error.message); });
    }
    try { await signOut(firebaseAuth); } catch { /* ignore */ }
    resetRecaptcha(RIDER_RECAPTCHA);
    riderConfirmationRef.current = null;
    setIsRiderAuthenticated(false);
    setRider(null);
    setRiderOrders([]);
    localStorage.removeItem(RIDER_STORAGE_KEY);
  }, [rider]);

  const toggleOnline = useCallback(() => {
    if (!rider) return;
    const newStatus = !rider.isOnline;
    setRider(prev => prev ? { ...prev, isOnline: newStatus } : null);
    supabase.from('riders').update({ is_online: newStatus }).eq('id', rider.id).then(({ error }) => {
      if (error) console.error('Toggle online error:', error.message);
    });
  }, [rider]);

  // Rider accepts an unassigned order
  const acceptDelivery = useCallback((orderId: string) => {
    if (!rider) return;
    setRiderOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, riderId: rider.id, riderName: rider.name, riderPhone: rider.phone, status: 'preparing' as const } : o
    ));
    supabase.from('orders').update({
      rider_id: rider.id,
      rider_name: rider.name,
      rider_phone: rider.phone,
      status: 'preparing',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Accept delivery error:', error.message);
    });
  }, [rider]);

  // Rider picked up from restaurant
  const markPickedUp = useCallback((orderId: string) => {
    if (!rider) return;
    setRiderOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'out-for-delivery' as const } : o
    ));
    supabase.from('orders').update({
      status: 'out-for-delivery',
      rider_location: rider.currentLat && rider.currentLng
        ? { lat: rider.currentLat, lng: rider.currentLng }
        : null,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Mark picked up error:', error.message);
    });
  }, [rider]);

  // Rider delivered
  const markDelivered = useCallback((orderId: string) => {
    if (!rider) return;
    setRiderOrders(prev => prev.filter(o => o.id !== orderId));

    // Increment delivery count
    const newTotal = rider.totalDeliveries + 1;
    setRider(prev => prev ? { ...prev, totalDeliveries: newTotal } : null);

    supabase.from('orders').update({
      status: 'delivered',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Mark delivered error:', error.message);
    });

    supabase.from('riders').update({ total_deliveries: newTotal }).eq('id', rider.id).then(({ error }) => {
      if (error) console.error('Update delivery count error:', error.message);
    });
  }, [rider]);

  // Update rider's GPS location
  const updateRiderLocation = useCallback((lat: number, lng: number) => {
    if (!rider) return;
    setRider(prev => prev ? { ...prev, currentLat: lat, currentLng: lng } : null);
    supabase.from('riders').update({ current_lat: lat, current_lng: lng }).eq('id', rider.id).then(({ error }) => {
      if (error) console.error('Update rider location error:', error.message);
    });

    // Also update location on all active rides
    riderOrders
      .filter(o => o.status === 'out-for-delivery')
      .forEach(o => {
        supabase.from('orders').update({ rider_location: { lat, lng } }).eq('id', o.id).then(({ error }) => {
          if (error) console.error('Update order rider location error:', error.message);
        });
      });
  }, [rider, riderOrders]);

  // Start GPS tracking when online
  useEffect(() => {
    if (!rider?.isOnline || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateRiderLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [rider?.isOnline, updateRiderLocation]);

  return (
    <RiderContext.Provider value={{
      isRiderAuthenticated, rider, riderOtpSent, riderOrders,
      riderLogin, riderVerifyOtp, riderLogout,
      toggleOnline, acceptDelivery, markPickedUp, markDelivered,
      updateRiderLocation,
    }}>
      {children}
    </RiderContext.Provider>
  );
}
