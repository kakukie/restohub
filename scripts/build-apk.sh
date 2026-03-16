#!/usr/bin/env bash
set -euo pipefail

# Simple one-shot Android APK builder for production servers.
# Assumes Node 22, JDK 21, and Android SDK (build-tools 35.0.0) are installed
# and ANDROID_HOME/ANDROID_SDK_ROOT point to the SDK path.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_APP_DIR="$ROOT_DIR/android"
APK_MODE="${APK_MODE:-debug}"
if [ "$APK_MODE" = "release" ]; then
  GRADLE_TASK="assembleRelease"
  APK_OUT="$ANDROID_APP_DIR/app/build/outputs/apk/release/app-release.apk"
  DIST_APK_NAME="app-release.apk"
elif [ "$APK_MODE" = "debug" ]; then
  GRADLE_TASK="assembleDebug"
  APK_OUT="$ANDROID_APP_DIR/app/build/outputs/apk/debug/app-debug.apk"
  DIST_APK_NAME="app-debug.apk"
else
  echo "ERROR: APK_MODE must be 'debug' or 'release', got: $APK_MODE"
  exit 1
fi
DIST_DIR="$ROOT_DIR/dist"
DIST_APK="$DIST_DIR/$DIST_APK_NAME"

ensure_node() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  # Explicit NODE_BIN override (default to /usr/local/bin/node)
  if [ -z "${NODE_BIN:-}" ]; then
    NODE_BIN="/usr/local/bin/node"
  fi

  if [ -n "${NODE_BIN:-}" ] && [ -x "$NODE_BIN" ]; then
    export PATH="$(dirname "$NODE_BIN"):$PATH"
    return 0
  fi

  # Use NODE_HOME if provided
  if [ -n "${NODE_HOME:-}" ] && [ -x "$NODE_HOME/bin/node" ]; then
    export PATH="$NODE_HOME/bin:$PATH"
    return 0
  fi

  # Search common install prefixes
  for dir in \
    /opt/node*/bin \
    /usr/local/lib/nodejs/node-v*/bin \
    /usr/local/node*/bin \
    /usr/local/bin \
    /usr/bin \
    "$HOME"/node*/bin \
    "$HOME"/.node/bin; do
    for candidate in $dir; do
      if [ -x "$candidate/node" ]; then
        export PATH="$candidate:$PATH"
        return 0
      fi
    done
  done

  # Try NVM default (if available)
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use 22 >/dev/null 2>&1 || true
    command -v node >/dev/null 2>&1 && return 0
  fi

  echo "ERROR: 'node' not found in PATH."
  echo "Hints:"
  echo "  export NODE_HOME=/opt/node-v22.x.x-linux-x64"
  echo "  export PATH=\"\$NODE_HOME/bin:\$PATH\""
  echo "  atau jalankan via Docker: scripts/build-apk-docker.sh"
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' not found in PATH"; exit 1; }
}

ensure_android_project_dirs() {
  mkdir -p "$ANDROID_APP_DIR/app/src/main/assets"
  mkdir -p "$ANDROID_APP_DIR/app/src/main/assets/public"
}

ensure_android_sdk() {
  local candidate=""

  if [ -n "${ANDROID_SDK_ROOT:-}" ] && [ -d "${ANDROID_SDK_ROOT}" ]; then
    candidate="${ANDROID_SDK_ROOT}"
  elif [ -n "${ANDROID_HOME:-}" ] && [ -d "${ANDROID_HOME}" ]; then
    candidate="${ANDROID_HOME}"
  else
    for sdk in \
      /opt/android-sdk \
      /opt/android-sdk-linux \
      /usr/lib/android-sdk \
      /usr/local/android-sdk \
      /sdk \
      "$HOME/Android/Sdk"; do
      if [ -d "$sdk" ]; then
        candidate="$sdk"
        break
      fi
    done
  fi

  if [ -z "$candidate" ]; then
    echo "ERROR: Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT inside the build environment."
    exit 1
  fi

  export ANDROID_HOME="$candidate"
  export ANDROID_SDK_ROOT="$candidate"

  for sdk_bin in \
    "$candidate/cmdline-tools/latest/bin" \
    "$candidate/cmdline-tools/bin" \
    "$candidate/tools/bin" \
    "$candidate/platform-tools"; do
    if [ -d "$sdk_bin" ]; then
      export PATH="$sdk_bin:$PATH"
    fi
  done

  if command -v sdkmanager >/dev/null 2>&1; then
    echo "Using Android SDK: $candidate"
  else
    echo "WARN: 'sdkmanager' not found in PATH; continuing with existing SDK at $candidate"
  fi

  printf 'sdk.dir=%s\n' "$candidate" > "$ANDROID_APP_DIR/local.properties"
}

echo "== Checking prerequisites =="
ensure_node
need npm
need npx
ensure_javac() {
  # Already in PATH?
  if command -v javac >/dev/null 2>&1; then return 0; fi

  # Try JAVA_HOME
  if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
    return 0
  fi

  # Try common JDK paths
  for jdk in /usr/lib/jvm/java-21-openjdk-amd64 /usr/lib/jvm/java-17-openjdk-amd64 /usr/lib/jvm/java-21-openjdk /opt/java/openjdk; do
    if [ -x "$jdk/bin/javac" ]; then
      export JAVA_HOME="$jdk"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done

  # Try installing if apt-get available
  if command -v apt-get >/dev/null 2>&1; then
    echo "Installing OpenJDK 21 via apt-get..."
    export DEBIAN_FRONTEND=noninteractive
    if command -v sudo >/dev/null 2>&1; then
      sudo apt-get update -y && sudo apt-get install -y openjdk-21-jdk
    else
      apt-get update -y && apt-get install -y openjdk-21-jdk
    fi
    # try detect JAVA_HOME from javac path
    if command -v javac >/dev/null 2>&1; then
      local_javac="$(command -v javac)"
      export JAVA_HOME="$(cd "$(dirname "$local_javac")/../.." && pwd)"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  fi

  echo "ERROR: 'javac' not found and could not install JDK. Set JAVA_HOME or install OpenJDK 21."
  exit 1
}

ensure_javac
ensure_android_sdk
ensure_android_project_dirs

echo "== Installing JS deps (npm ci) =="
cd "$ROOT_DIR"
npm ci

echo "== Generating web app icons =="
node ./scripts/generate-icons.js

echo "== Generating Android icons from web app icon =="
node ./scripts/generate-android-icons.js

echo "== Sync Capacitor Android =="
npx cap sync android

echo "== Building APK ($APK_MODE) =="
cd "$ANDROID_APP_DIR"
chmod +x ./gradlew
./gradlew "$GRADLE_TASK"

echo "== Collecting APK =="
mkdir -p "$DIST_DIR"

if [ ! -f "$APK_OUT" ]; then
  OUTPUT_DIR="$ANDROID_APP_DIR/app/build/outputs/apk/$APK_MODE"
  CANDIDATE_APK="$(find "$OUTPUT_DIR" -maxdepth 1 -type f -name '*.apk' | sort | tail -n 1 || true)"
  if [ -n "${CANDIDATE_APK:-}" ] && [ -f "$CANDIDATE_APK" ]; then
    APK_OUT="$CANDIDATE_APK"
  else
    echo "ERROR: APK output not found in $OUTPUT_DIR"
    exit 1
  fi
fi

cp "$APK_OUT" "$DIST_APK"

echo "Build complete."
echo "APK: $DIST_APK"
