import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  PhoneAuthProvider,
  type ConfirmationResult,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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

const isNative = Capacitor.isNativePlatform();

// ---------- Web reCAPTCHA path (unchanged for browsers) ----------
const verifiers = new Map<string, RecaptchaVerifier>();

export function getRecaptcha(containerId = 'recaptcha-container'): RecaptchaVerifier {
  const existing = verifiers.get(containerId);
  if (existing) return existing;
  const v = new RecaptchaVerifier(firebaseAuth, containerId, { size: 'invisible' });
  verifiers.set(containerId, v);
  return v;
}

export function resetRecaptcha(containerId?: string) {
  if (isNative) return; // no-op on native; reCAPTCHA isn't used there
  if (containerId) {
    const v = verifiers.get(containerId);
    if (v) { try { v.clear(); } catch { /* ignore */ } verifiers.delete(containerId); }
    return;
  }
  for (const [id, v] of verifiers) { try { v.clear(); } catch { /* ignore */ } verifiers.delete(id); }
}

// ---------- Unified OTP API ----------
// All existing call sites use only `.confirm(code)` from the returned object.
// On native we mimic that single-method contract via @capacitor-firebase/authentication.
// On web, behavior is unchanged.
export async function sendPhoneOtp(
  phoneE164: string,
  containerId = 'recaptcha-container',
): Promise<ConfirmationResult> {
  if (isNative) {
    // v8 API: signInWithPhoneNumber() resolves to void; verificationId arrives
    // via the `phoneCodeSent` event listener. Auto-retrieval on Android may
    // also complete sign-in via `phoneVerificationCompleted` (we'll still
    // surface the standard ConfirmationResult shape to call sites).
    const verificationId = await new Promise<string>((resolve, reject) => {
      let codeHandle: { remove: () => Promise<void> } | null = null;
      let failHandle: { remove: () => Promise<void> } | null = null;
      const cleanup = () => {
        codeHandle?.remove().catch(() => {});
        failHandle?.remove().catch(() => {});
      };
      FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
        cleanup();
        resolve(event.verificationId);
      }).then((h) => { codeHandle = h; });
      FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
        cleanup();
        reject(new Error(event.message || 'Phone verification failed'));
      }).then((h) => { failHandle = h; });
      FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phoneE164 }).catch((err) => {
        cleanup();
        reject(err);
      });
    });

    const shim: ConfirmationResult = {
      verificationId,
      confirm: async (code: string) => {
        const credential = PhoneAuthProvider.credential(verificationId, code);
        return signInWithCredential(firebaseAuth, credential);
      },
    };
    return shim;
  }

  const verifier = getRecaptcha(containerId);
  return signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
}
