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

ensure_node() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  # Try NODE_HOME hint
  if [ -n "${NODE_HOME:-}" ] && [ -x "$NODE_HOME/bin/node" ]; then
    export PATH="$NODE_HOME/bin:$PATH"
    return 0
  fi

  # Try NVM default (if available)
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use 22 >/dev/null 2>&1 || true
    command -v node >/dev/null 2>&1 && return 0
  fi

  echo "ERROR: 'node' not found in PATH. Set NODE_HOME or install Node 22."
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' not found in PATH"; exit 1; }
}

echo "== Checking prerequisites =="
ensure_node
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
