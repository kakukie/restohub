#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${APK_BUILDER_IMAGE:-restohub-apk-builder:latest}"
DOCKERFILE_PATH="${APK_BUILDER_DOCKERFILE:-$ROOT_DIR/docker/apk-builder.Dockerfile}"
WORKDIR_IN_CONTAINER="${APK_BUILDER_WORKDIR:-/workspace}"
GRADLE_CACHE_DIR="${GRADLE_CACHE_DIR:-$ROOT_DIR/.cache/gradle}"
NPM_CACHE_DIR="${NPM_CACHE_DIR:-$ROOT_DIR/.cache/npm}"
FORCE_REBUILD="${FORCE_REBUILD:-0}"

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker not found in PATH."
    exit 1
  fi
}

build_image() {
  if [ "$FORCE_REBUILD" = "1" ] || ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    echo "== Building APK builder image =="
    docker build -t "$IMAGE_NAME" -f "$DOCKERFILE_PATH" "$ROOT_DIR"
  else
    echo "== Using existing APK builder image: $IMAGE_NAME =="
  fi
}

run_builder() {
  mkdir -p "$GRADLE_CACHE_DIR" "$NPM_CACHE_DIR" "$ROOT_DIR/dist"

  echo "== Running APK build in isolated builder container =="
  docker run --rm \
    -v "$ROOT_DIR:$WORKDIR_IN_CONTAINER" \
    -v "$GRADLE_CACHE_DIR:/root/.gradle" \
    -v "$NPM_CACHE_DIR:/root/.npm" \
    -w "$WORKDIR_IN_CONTAINER" \
    -e CI=1 \
    -e APK_MODE="${APK_MODE:-debug}" \
    "$IMAGE_NAME" \
    bash ./scripts/build-apk.sh
}

print_result() {
  local apk_name="app-debug.apk"
  if [ "${APK_MODE:-debug}" = "release" ]; then
    apk_name="app-release.apk"
  fi
  local apk_path="$ROOT_DIR/dist/$apk_name"
  if [ -f "$apk_path" ]; then
    echo "== APK ready =="
    echo "APK: $apk_path"
  else
    echo "ERROR: build finished without creating $apk_path"
    exit 1
  fi
}

ensure_docker
build_image
run_builder
print_result
