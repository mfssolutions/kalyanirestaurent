import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

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

  // Restore auth from Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data && data.name) {
              const user: User = {
                id: data.id,
                name: data.name,
                mobile: data.phone,
                addresses: data.addresses || [],
              };
              setState(s => ({ ...s, user, isAuthenticated: true, loading: false }));
            } else {
              localStorage.removeItem(STORAGE_KEY);
              setState(s => ({ ...s, loading: false }));
            }
          });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setState(s => ({ ...s, loading: false }));
      }
    });
  }, []);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.user]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const phone = session.user.phone || '';
        // Check if we already have this user in local state
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const existingUser = JSON.parse(saved) as User;
          if (existingUser.mobile === phone) return;
        }
        // Look up profile in Supabase
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data && data.name) {
              const user: User = {
                id: data.id,
                name: data.name,
                mobile: data.phone,
                addresses: data.addresses || [],
              };
              setState(s => ({ ...s, user, isAuthenticated: true, isAuthModalOpen: false }));
            }
          });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = useCallback(() => {
    setState(s => ({ ...s, isAuthModalOpen: true, authStep: 'phone', otpSent: false, otpVerified: false, loading: false }));
  }, []);

  const closeAuthModal = useCallback(() => {
    setState(s => ({ ...s, isAuthModalOpen: false, pendingMobile: null, otpSent: false, otpVerified: false, authStep: 'phone', loading: false }));
  }, []);

  const sendOtp = useCallback(async (mobile: string): Promise<{ success: boolean; error?: string }> => {
    setState(s => ({ ...s, loading: true }));
    const phone = `+91${mobile}`;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setState(s => ({ ...s, loading: false }));
      return { success: false, error: error.message };
    }
    setState(s => ({ ...s, pendingMobile: mobile, otpSent: true, authStep: 'otp', loading: false }));
    return { success: true };
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<{ success: boolean; isNewUser?: boolean; error?: string }> => {
    setState(s => ({ ...s, loading: true }));
    const phone = `+91${state.pendingMobile}`;
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) {
      setState(s => ({ ...s, loading: false }));
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Check if user has a profile already
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile && profile.name) {
        // Existing user — log them in
        const existingUser: User = {
          id: profile.id,
          name: profile.name,
          mobile: profile.phone,
          addresses: profile.addresses || [],
        };
        setState(s => ({ ...s, user: existingUser, isAuthenticated: true, otpVerified: true, isAuthModalOpen: false, loading: false }));
        return { success: true, isNewUser: false };
      } else {
        // New user — need name
        setState(s => ({ ...s, otpVerified: true, authStep: 'name', loading: false }));
        return { success: true, isNewUser: true };
      }
    }

    setState(s => ({ ...s, loading: false }));
    return { success: false, error: 'Verification failed' };
  }, [state.pendingMobile]);

  const completeSignup = useCallback(async (name: string) => {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;

    if (!userId) {
      console.error('No authenticated session found during signup');
      return;
    }

    const newUser: User = {
      id: userId,
      name,
      mobile: state.pendingMobile!,
      addresses: [],
    };

    // Save profile to Supabase
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
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
    await supabase.auth.signOut();
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
    setState(s => ({ ...s, authStep: 'phone', otpSent: false, otpVerified: false, pendingMobile: null, loading: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, openAuthModal, closeAuthModal, sendOtp, verifyOtp, completeSignup, logout, resetAuthFlow }}>
      {children}
    </AuthContext.Provider>
  );
}
