import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import { firebaseAuth, sendPhoneOtp, resetRecaptcha } from '../lib/firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  pendingMobile: string | null;
  otpSent: boolean;
  otpVerified: boolean;
  authStep: 'phone' | 'otp' | 'name';
  loading: boolean;
}

interface AuthContextType extends AuthState {
  openAuthModal: () => void;
  closeAuthModal: () => void;
  sendOtp: (mobile: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  completeSignup: (name: string) => void;
  logout: () => void;
  resetAuthFlow: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const STORAGE_KEY = 'kalyani_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAuthModalOpen: false,
    pendingMobile: null,
    otpSent: false,
    otpVerified: false,
    authStep: 'phone',
    loading: true,
  });

  // Holds the active Firebase confirmation between sendOtp and verifyOtp
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const pendingUidRef = useRef<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved) as User;
        setState(s => ({ ...s, user, isAuthenticated: true, loading: false }));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState(s => ({ ...s, loading: false }));
      }
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.user]);

  const openAuthModal = useCallback(() => {
    setState(s => ({ ...s, isAuthModalOpen: true, authStep: 'phone', otpSent: false, otpVerified: false, loading: false }));
  }, []);

  const closeAuthModal = useCallback(() => {
    resetRecaptcha();
    confirmationRef.current = null;
    setState(s => ({ ...s, isAuthModalOpen: false, pendingMobile: null, otpSent: false, otpVerified: false, authStep: 'phone', loading: false }));
  }, []);

  const sendOtp = useCallback(async (mobile: string): Promise<{ success: boolean; error?: string }> => {
    setState(s => ({ ...s, loading: true }));
    try {
      const phone = `+91${mobile}`;
      const confirmation = await sendPhoneOtp(phone);
      confirmationRef.current = confirmation;
      setState(s => ({ ...s, pendingMobile: mobile, otpSent: true, authStep: 'otp', loading: false }));
      return { success: true };
    } catch (err) {
      const message = (err as Error).message || 'Failed to send OTP';
      resetRecaptcha();
      setState(s => ({ ...s, loading: false }));
      return { success: false, error: message };
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<{ success: boolean; isNewUser?: boolean; error?: string }> => {
    setState(s => ({ ...s, loading: true }));
    if (!confirmationRef.current) {
      setState(s => ({ ...s, loading: false }));
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
        const existingUser: User = {
          id: profile.id,
          name: profile.name,
          mobile: profile.phone,
          addresses: profile.addresses || [],
        };
        setState(s => ({ ...s, user: existingUser, isAuthenticated: true, otpVerified: true, isAuthModalOpen: false, loading: false }));
        return { success: true, isNewUser: false };
      }

      setState(s => ({ ...s, otpVerified: true, authStep: 'name', loading: false }));
      return { success: true, isNewUser: true };
    } catch (err) {
      setState(s => ({ ...s, loading: false }));
      return { success: false, error: (err as Error).message || 'Invalid OTP' };
    }
  }, []);

  const completeSignup = useCallback(async (name: string) => {
    const uid = pendingUidRef.current || firebaseAuth.currentUser?.uid;
    if (!uid) {
      console.error('No authenticated Firebase user found during signup');
      return;
    }

    const newUser: User = {
      id: uid,
      name,
      mobile: state.pendingMobile!,
      addresses: [],
    };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: uid,
        name: newUser.name,
        phone: newUser.mobile,
        addresses: newUser.addresses,
      });

    if (error) {
      console.error('Profile upsert error:', error.message);
      return;
    }

    setState(s => ({ ...s, user: newUser, isAuthenticated: true, isAuthModalOpen: false }));
  }, [state.pendingMobile]);

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    try { await signOut(firebaseAuth); } catch { /* ignore */ }
    resetRecaptcha();
    confirmationRef.current = null;
    pendingUidRef.current = null;
    setState({
      user: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      pendingMobile: null,
      otpSent: false,
      otpVerified: false,
      authStep: 'phone',
      loading: false,
    });
  }, []);

  const resetAuthFlow = useCallback(() => {
    resetRecaptcha();
    confirmationRef.current = null;
    setState(s => ({ ...s, authStep: 'phone', otpSent: false, otpVerified: false, pendingMobile: null, loading: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, openAuthModal, closeAuthModal, sendOtp, verifyOtp, completeSignup, logout, resetAuthFlow }}>
      {children}
    </AuthContext.Provider>
  );
}
