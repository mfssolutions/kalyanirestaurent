import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kalyanikitchen.app',
  appName: 'kalyani Kitchen',
  webDir: 'dist',
  // Bundle the built web assets inside the APK (offline-capable shell).
  // To point at a live server during development, set
  //   server: { url: 'http://10.0.2.2:5173', cleartext: true }
  // and remove it before building a release.
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    FirebaseAuthentication: {
      // Skip the native Auth SDK provider list we don't use; phone is enough.
      skipNativeAuth: false,
      providers: ['phone.provider'],
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
