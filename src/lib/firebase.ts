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

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getRecaptcha(containerId = 'recaptcha-container'): RecaptchaVerifier {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
  });
  return recaptchaVerifier;
}

export function resetRecaptcha() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch { /* ignore */ }
    recaptchaVerifier = null;
  }
}

export async function sendPhoneOtp(phoneE164: string): Promise<ConfirmationResult> {
  const verifier = getRecaptcha();
  return signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
}
