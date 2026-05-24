package com.kalyanikitchen.app;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "KalyaniAppCheck";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize Firebase explicitly (in case google-services plugin hasn't auto-initialized yet
        // before any Firebase service is touched).
        FirebaseApp.initializeApp(this);

        // App Check installation is what stops Firebase Phone Auth from falling back
        // to reCAPTCHA-in-Chrome on Android. Without this call the SDK opens a browser
        // tab to verify the user, regardless of Play Integrity registration in the console.
        FirebaseAppCheck appCheck = FirebaseAppCheck.getInstance();

        if (BuildConfig.DEBUG) {
            // Debug builds use the debug provider. On first launch logcat prints
            //   "Enter this debug secret into the allow list in the Firebase Console..."
            // Copy that token into Firebase Console → App Check → Manage debug tokens.
            appCheck.installAppCheckProviderFactory(
                DebugAppCheckProviderFactory.getInstance()
            );
            Log.i(TAG, "Installed Debug App Check provider — copy debug token from logcat");
        } else {
            // Release builds use Play Integrity. This requires the APK signature's
            // SHA-256 to be registered in Firebase Console → Project Settings → Android
            // app fingerprints (already done for v1.0.9). For non-Play-Store installs the
            // device will still attempt a Play Integrity attestation; if Google Play
            // Services is healthy on the phone this succeeds without any browser.
            appCheck.installAppCheckProviderFactory(
                PlayIntegrityAppCheckProviderFactory.getInstance()
            );
            Log.i(TAG, "Installed Play Integrity App Check provider");
        }
    }
}

