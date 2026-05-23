import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import type { User, Address } from '../types';
import { supabase } from '../lib/supabase';
import { firebaseAuth, sendPhoneOtp, resetRecaptcha } from '../lib/firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface VerifyResult {
  success: boolean;
  isNewUser?: boolean;
  uid?: string;
  error?: string;
}

interface SignupPayload {
  name: string;
  address: Omit<Address, 'id'>;
}

interface AuthContextType extends AuthState {
  pendingMobile: string | null;
  sendOtp: (mobile: string, containerId?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<VerifyResult>;
  completeSignup: (payload: SignupPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetAuthFlow: (containerId?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const STORAGE_KEY = 'kalyani_user';
const DEFAULT_RECAPTCHA = 'recaptcha-customer';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });
  const [pendingMobile, setPendingMobile] = useState<string | null>(null);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const pendingUidRef = useRef<string | null>(null);
  const lastContainerRef = useRef<string>(DEFAULT_RECAPTCHA);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved) as User;
        setState({ user, isAuthenticated: true, loading: false });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState(s => ({ ...s, loading: false }));
      }
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state.user]);

  const sendOtp = useCallback(async (mobile: string, containerId = DEFAULT_RECAPTCHA) => {
    lastContainerRef.current = containerId;
    try {
      const phone = `+91${mobile}`;
      const confirmation = await sendPhoneOtp(phone, containerId);
      confirmationRef.current = confirmation;
      setPendingMobile(mobile);
      return { success: true };
    } catch (err) {
      resetRecaptcha(containerId);
      return { success: false, error: (err as Error).message || 'Failed to send OTP' };
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<VerifyResult> => {
    if (!confirmationRef.current) {
      return { success: false, error: 'Session expired. Please request OTP again.' };
    }
    try {
      const cred = await confirmationRef.current.confirm(otp);
      const uid = cred.user.uid;
      pendingUidRef.current = uid;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (profile && profile.name) {
        const user: User = {
          id: profile.id,
          name: profile.name,
          mobile: profile.phone,
          addresses: profile.addresses || [],
        };
        setState({ user, isAuthenticated: true, loading: false });
        return { success: true, isNewUser: false, uid };
      }

      return { success: true, isNewUser: true, uid };
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Invalid OTP' };
    }
  }, []);

  const completeSignup = useCallback(async ({ name, address }: SignupPayload) => {
    const uid = pendingUidRef.current || firebaseAuth.currentUser?.uid;
    if (!uid || !pendingMobile) {
      return { success: false, error: 'Session expired. Please start again.' };
    }
    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      label: address.label || 'Home',
      fullAddress: address.fullAddress,
      pincode: address.pincode,
      lat: address.lat,
      lng: address.lng,
    };
    const newUser: User = {
      id: uid,
      name,
      mobile: pendingMobile,
      addresses: [newAddress],
    };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: uid,
        name: newUser.name,
        phone: newUser.mobile,
        addresses: newUser.addresses,
      });

    if (error) return { success: false, error: error.message };
    setState({ user: newUser, isAuthenticated: true, loading: false });
    return { success: true };
  }, [pendingMobile]);

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    try { await signOut(firebaseAuth); } catch { /* ignore */ }
    resetRecaptcha(lastContainerRef.current);
    confirmationRef.current = null;
    pendingUidRef.current = null;
    setPendingMobile(null);
    setState({ user: null, isAuthenticated: false, loading: false });
  }, []);

  const resetAuthFlow = useCallback((containerId = DEFAULT_RECAPTCHA) => {
    resetRecaptcha(containerId);
    confirmationRef.current = null;
    setPendingMobile(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      pendingMobile,
      sendOtp,
      verifyOtp,
      completeSignup,
      logout,
      resetAuthFlow,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
