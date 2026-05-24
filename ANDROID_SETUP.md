# Kalyani Kitchen — Android App (Capacitor)

This document explains how to build and run the Android wrapper around the existing
React + Vite web app. **The web app is unchanged** — it continues to deploy to AWS
Amplify exactly as before. Capacitor only adds a second output target.

- App ID: `com.kalyanikitchen.app`
- App Name: `kalyani Kitchen`
- Roles supported: Customer + Admin (other roles continue using the web app)
- Capacitor: v8 · Android platform: v8

---

## 1. One-time machine setup (Android dev)

You only need this on the machine that will produce the APK / open Android Studio.
The web build does **not** require any of this.

1. Install **Android Studio** (Hedgehog or newer) — https://developer.android.com/studio
2. From Android Studio → SDK Manager: install **Android SDK Platform 34** (or newer)
   and **Android SDK Build-Tools**.
3. Install **JDK 17** (Android Gradle Plugin 8.x requires JDK 17).
4. Set environment variables (add to `~/.bashrc` / `~/.zshrc`):
   ```bash
   export ANDROID_HOME="$HOME/Android/Sdk"
   export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
   export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"   # adjust for your OS
   ```
5. Accept SDK licenses once:
   ```bash
   sdkmanager --licenses
   ```

> The current Codespace **does not** have the Android SDK / JDK 17 installed, so the
> actual APK build must run on your local machine (or in a CI runner with the SDK).

---

## 2. Firebase native configuration (required for OTP login)

The Android app uses `@capacitor-firebase/authentication`, which talks to **native**
Firebase Auth (real SMS, no reCAPTCHA needed).

1. In the Firebase Console → Project Settings → **Add app** → Android.
2. Use package name: **`com.kalyanikitchen.app`** (must match exactly).
3. Download `google-services.json`.
4. Place the file at:
   ```
   android/app/google-services.json
   ```
5. Add your release **SHA-1** and **SHA-256** fingerprints to the Firebase Android app
   settings (needed for Phone Auth to work on real devices):
   - Debug key:
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore \
       -alias androiddebugkey -storepass android -keypass android
     ```
   - Release key: from your production `*.jks` (see §5 below).
6. In Firebase Console → Authentication → Sign-in method → **Phone**, ensure it's
   enabled and that your test phone numbers (if any) are added.

> Without `google-services.json` the app will still install but phone OTP will fail.

---

## 3. Project structure

```
/                       ← web app (unchanged, deploys to Amplify)
├── src/                ← shared React code (runs on web AND in Android WebView)
├── dist/               ← Vite build output (bundled into APK at sync time)
├── capacitor.config.ts ← Capacitor config (web app aware)
└── android/            ← Native Android Studio project (committed)
    └── app/
        ├── google-services.json   ← you add this (not committed by default)
        └── src/main/assets/public ← regenerated each `cap sync` (gitignored)
```

The web app and Android app are **the same codebase**. Native-only behavior is
gated behind `Capacitor.isNativePlatform()` checks in `src/lib/firebase.ts` and
`src/lib/native.ts`. On the web, those checks are `false`, so nothing changes.

---

## 4. Daily workflow

### Build the web bundle and copy into Android
```bash
npm run android:build      # tsc + vite build + cap sync android
```

### Open in Android Studio
```bash
npm run android:open
```
Then click **Run ▶** to launch on an emulator or USB-connected device.

### Run directly via Capacitor CLI (requires a connected device or running emulator)
```bash
npm run android:run
```

### Live-reload while developing (optional)
Edit `capacitor.config.ts`, add:
```ts
server: { url: 'http://<your-LAN-IP>:5173', cleartext: true }
```
Then run `npm run dev` and `npx cap run android`. **Remove this block before
shipping a release build.**

### Just sync without rebuilding TypeScript
```bash
npx cap sync android
```

---

## 5. Release build (signed APK / AAB)

1. Generate a release keystore (once, keep this file safe — losing it means you can
   never update the app on Play Store):
   ```bash
   keytool -genkey -v -keystore kalyani-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias kalyani
   ```
2. Create `android/key.properties` (gitignored):
   ```properties
   storeFile=/absolute/path/to/kalyani-release.jks
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=kalyani
   keyPassword=YOUR_KEY_PASSWORD
   ```
3. Wire it into `android/app/build.gradle` (one-time edit) — add inside `android { ... }`:
   ```gradle
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   signingConfigs {
       release {
           if (keystorePropertiesFile.exists()) {
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
           }
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
       }
   }
   ```
4. Build the release artifacts:
   ```bash
   npm run android:build
   cd android
   ./gradlew assembleRelease       # APK  → app/build/outputs/apk/release/app-release.apk
   ./gradlew bundleRelease         # AAB  → app/build/outputs/bundle/release/app-release.aab
   ```
5. Upload the **AAB** to Google Play Console for distribution.

---

## 6. Permissions added (declared via plugins)

Already configured automatically by the installed plugins:

| Plugin | Permission | Why |
|--------|------------|-----|
| `@capacitor/geolocation` | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | Checkout address autofill, rider GPS |
| `@capacitor/camera` | `CAMERA`, `READ_MEDIA_IMAGES` | Admin menu image upload |
| `@capacitor/push-notifications` | `POST_NOTIFICATIONS` (Android 13+) | Order alerts |
| `@capacitor/network` | `ACCESS_NETWORK_STATE` | Offline detection |
| `@capacitor-firebase/authentication` | `INTERNET` | Phone OTP |

If you want to reduce surface area later, edit `android/app/src/main/AndroidManifest.xml`.

---

## 7. Push notifications setup (optional, do later)

Push requires a small amount of native + backend work:

1. In Firebase Console → Project Settings → **Cloud Messaging**, enable FCM.
2. The Android app already includes `@capacitor/push-notifications`. On first launch
   you need to call `PushNotifications.requestPermissions()` and `register()` from
   your React code (e.g., once the user logs in).
3. Store the device's FCM token in Supabase (`profiles.fcm_token` column — add
   migration when you're ready).
4. To send a push, call FCM HTTP v1 from a Supabase Edge Function with the user's
   token, triggered from the admin's "accept order" / "assign rider" flows.

This is **not wired up yet** — only the plugin is installed and ready.

---

## 8. What changed in the repo (web is NOT broken)

| File | Change | Affects web? |
|------|--------|--------------|
| `package.json` | Added Capacitor deps + `android:*` scripts | No (only new scripts) |
| `capacitor.config.ts` | New file | No |
| `src/lib/firebase.ts` | `sendPhoneOtp()` now checks `Capacitor.isNativePlatform()` | **No** — on web, the original reCAPTCHA path runs exactly as before |
| `src/lib/native.ts` | New helpers (`getCurrentPosition`, `nativeStorage`, etc.) | No — opt-in only, nothing imports it yet |
| `.gitignore` | Ignore Android build artifacts | No |
| `android/` | New scaffolded Android Studio project | No |

Running `npm run dev` and `npm run build` produces the **same** web app as before.
Running `npm run android:build` additionally produces the Android project.

---

## 9. Troubleshooting

- **"Default FirebaseApp is not initialized"** → `google-services.json` is missing
  or placed in the wrong folder. Must be at `android/app/google-services.json`.
- **OTP never arrives** → Add the device's SHA-1 to Firebase project settings; on
  emulators, add a test phone number in Firebase Auth.
- **`cap sync android` says "web assets not found"** → Run `npm run build` first.
- **Gradle/SDK version mismatch** → Open `android/` in Android Studio and let it
  auto-resolve, or run `cd android && ./gradlew --refresh-dependencies`.
- **Web app behaves differently after this change** → Hard refresh; the only
  runtime change is `firebase.ts`, which short-circuits to the original branch
  whenever `Capacitor.isNativePlatform()` is false (which is always true on web).

---

## 10. Production builds via GitHub Actions

Two workflows are committed under `.github/workflows/`:

| Workflow | Trigger | Output |
|----------|---------|--------|
| [android-debug.yml](.github/workflows/android-debug.yml) | Every PR to `main` (+ manual) | Unsigned **debug APK** (smoke test) |
| [android-release.yml](.github/workflows/android-release.yml) | Push to `main`, tag `v*`, manual | **Signed AAB + APK** uploaded as artifacts; on tag push, also creates a GitHub Release |

### 10.1 Required GitHub secrets

Go to **GitHub → repo Settings → Secrets and variables → Actions → New repository secret** and add:

#### Signing
| Secret | How to get it |
|--------|---------------|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w 0 release.jks` (use the helper script below) |
| `ANDROID_KEYSTORE_PASSWORD` | Store password chosen when running `keytool` |
| `ANDROID_KEY_ALIAS` | e.g. `kalyani` |
| `ANDROID_KEY_PASSWORD` | Key password chosen when running `keytool` |

#### Firebase native config
| Secret | How to get it |
|--------|---------------|
| `GOOGLE_SERVICES_JSON_BASE64` | `base64 -w 0 google-services.json` (use the helper script below) |

#### Frontend env (Vite reads these at build time)
| Secret |
|--------|
| `VITE_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` |
| `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `VITE_FIREBASE_APP_ID` |
| `VITE_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` |

### 10.2 Helper to encode secrets

Run locally to get the base64 strings (does not commit anything):

```bash
./scripts/prepare-android-secrets.sh /path/to/release.jks /path/to/google-services.json
```

Copy each printed block into the corresponding GitHub secret.

### 10.3 Triggering a release build

**Option A — push a version tag (recommended)**
```bash
git tag v1.0.0
git push origin v1.0.0
```
This builds, signs, uploads artifacts, and creates a GitHub Release with the AAB + APK attached. The `versionName` is taken from the tag (without the `v`), the `versionCode` is the workflow run number.

**Option B — manual dispatch**
GitHub → Actions → *Android Release Build* → **Run workflow** → optionally specify `version_name` and `version_code`.

**Option C — push to `main`**
Every push to `main` also produces signed artifacts (downloadable from the Actions run page for 90 days), but does **not** create a GitHub Release.

### 10.4 Downloading the AAB

1. Open the workflow run → scroll to **Artifacts** at the bottom.
2. Download `kalyani-kitchen-aab-v<version>.zip` → unzip → get `kalyani-kitchen-v<version>-<code>.aab`.
3. Upload that AAB to Google Play Console.

### 10.5 Version numbering rules

- `versionName` (user-facing, e.g. `1.2.0`): from tag, manual input, or `package.json`.
- `versionCode` (integer, must increment for each Play upload): from `github.run_number` by default. Override via workflow_dispatch input if needed.

### 10.6 Security notes for CI

- Keystore and `google-services.json` are decoded into the runner, used, and then
  deleted in the workflow's final `Cleanup signing artifacts` step (also automatic
  when the ephemeral runner terminates).
- PRs from forks do **not** receive secrets, so the debug workflow uses placeholder
  envs and still produces a valid APK for smoke testing.
- The signing config in `android/app/build.gradle` only activates when
  `android/key.properties` exists, so a local checkout without the keystore can
  still produce unsigned debug builds.

