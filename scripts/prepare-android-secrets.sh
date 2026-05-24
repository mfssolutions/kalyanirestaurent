#!/usr/bin/env bash
# Helper: encode the release keystore and google-services.json to base64,
# ready to paste into GitHub repository secrets.
#
# Usage:
#   ./scripts/prepare-android-secrets.sh path/to/release.jks path/to/google-services.json
#
# Outputs the base64 strings (no newlines) for:
#   ANDROID_KEYSTORE_BASE64
#   GOOGLE_SERVICES_JSON_BASE64
#
# It does NOT write or commit anything. Pipe to your clipboard if needed:
#   ./scripts/prepare-android-secrets.sh ... | tee /tmp/secrets.txt

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <release.jks> <google-services.json>" >&2
  exit 1
fi

KEYSTORE="$1"
GSJSON="$2"

[ -f "$KEYSTORE" ] || { echo "Keystore not found: $KEYSTORE" >&2; exit 1; }
[ -f "$GSJSON" ]   || { echo "google-services.json not found: $GSJSON" >&2; exit 1; }

# -w 0 → no line wrapping (compatible with macOS/Linux)
b64() {
  if base64 --help 2>&1 | grep -q -- '-w'; then
    base64 -w 0 "$1"
  else
    base64 "$1" | tr -d '\n'
  fi
}

echo "==> ANDROID_KEYSTORE_BASE64"
b64 "$KEYSTORE"
echo
echo
echo "==> GOOGLE_SERVICES_JSON_BASE64"
b64 "$GSJSON"
echo
echo
echo "Now add the above to GitHub → repo Settings → Secrets and variables → Actions."
echo "You also need: ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD,"
echo "and the VITE_FIREBASE_* / VITE_SUPABASE_* values."
