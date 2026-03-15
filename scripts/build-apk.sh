#!/usr/bin/env bash
set -euo pipefail

# Simple one-shot Android APK builder for production servers.
# Assumes Node 22, JDK 21, and Android SDK (build-tools 35.0.0) are installed
# and ANDROID_HOME/ANDROID_SDK_ROOT point to the SDK path.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_APP_DIR="$ROOT_DIR/android"
APK_OUT="$ANDROID_APP_DIR/app/build/outputs/apk/release/app-release.apk"
DIST_DIR="$ROOT_DIR/dist"
DIST_APK="$DIST_DIR/app-release.apk"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' not found in PATH"; exit 1; }
}

echo "== Checking prerequisites =="
need node
need npm
need npx
need javac
need sdkmanager || echo "WARN: sdkmanager not found; assume SDK already installed."

echo "== Installing JS deps (npm ci) =="
cd "$ROOT_DIR"
npm ci

echo "== Sync Capacitor Android =="
npx cap sync android

echo "== Building APK release =="
cd "$ANDROID_APP_DIR"
./gradlew assembleRelease

echo "== Collecting APK =="
mkdir -p "$DIST_DIR"
cp "$APK_OUT" "$DIST_APK"

echo "Build complete."
echo "APK: $DIST_APK"
