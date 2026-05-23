import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error('Missing Firebase environment variables');
}

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

const verifiers = new Map<string, RecaptchaVerifier>();

export function getRecaptcha(containerId = 'recaptcha-container'): RecaptchaVerifier {
  const existing = verifiers.get(containerId);
  if (existing) return existing;
  const v = new RecaptchaVerifier(firebaseAuth, containerId, { size: 'invisible' });
  verifiers.set(containerId, v);
  return v;
}

export function resetRecaptcha(containerId?: string) {
  if (containerId) {
    const v = verifiers.get(containerId);
    if (v) { try { v.clear(); } catch { /* ignore */ } verifiers.delete(containerId); }
    return;
  }
  for (const [id, v] of verifiers) { try { v.clear(); } catch { /* ignore */ } verifiers.delete(id); }
}

export async function sendPhoneOtp(phoneE164: string, containerId = 'recaptcha-container'): Promise<ConfirmationResult> {
  const verifier = getRecaptcha(containerId);
  return signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
}
