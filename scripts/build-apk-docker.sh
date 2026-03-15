#!/usr/bin/env bash
# Ensure bash even if invoked via sh
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Run APK build inside specified Docker containers.
# Defaults:
#   CONTAINERS: "meenuin-app-1 meenuin-app-2"
#   APP_PATH: "/app"   (path to repo inside container)
#   NODE_BIN: "/usr/local/bin/node"

CONTAINERS=${CONTAINERS:-"meenuin-app-1 meenuin-app-2"}
APP_PATH=${APP_PATH:-"/app"}
NODE_BIN=${NODE_BIN:-"/usr/local/bin/node"}
JAVA_HOME_DOCKER=${JAVA_HOME_DOCKER:-"/usr/lib/jvm/java-21-openjdk-amd64"}

run_in_container() {
  local c="$1"
  echo "== Building inside container $c =="
  docker exec -i "$c" /bin/bash -lc "
    set -euo pipefail
    export NODE_BIN=\"$NODE_BIN\"
    JHD=\"${JAVA_HOME_DOCKER:-}\"
    if [ -n \"\$JHD\" ] && [ -d \"\$JHD\" ]; then
      export JAVA_HOME=\"\$JHD\"
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    elif command -v javac >/dev/null 2>&1; then
      JBIN=\$(command -v javac)
      export JAVA_HOME=\$(cd \$(dirname \"\$JBIN\")/../.. && pwd)
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    else
      DOWNLOAD_JDK=0
      if command -v apt-get >/dev/null 2>&1; then
        echo \"Installing OpenJDK 21 inside container $c...\"
        export DEBIAN_FRONTEND=noninteractive
        if [ -w /var/lib/apt/lists ] && [ -w /var/cache/apt/archives ]; then
          apt-get update -y && apt-get install -y openjdk-21-jdk
        elif command -v sudo >/dev/null 2>&1; then
          sudo apt-get update -y && sudo apt-get install -y openjdk-21-jdk
        else
          echo \"WARN: No permission to run apt-get; falling back to portable JDK download.\"
          DOWNLOAD_JDK=1
        fi
      else
        DOWNLOAD_JDK=1
      fi

      if [ \"\$DOWNLOAD_JDK\" -eq 1 ]; then
        TMP_JDK=/tmp/jdk21
        mkdir -p \"\$TMP_JDK\"
        echo \"Downloading portable Temurin JDK 21 to \$TMP_JDK ...\"
        JDK_URL=\"https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz\"
        if command -v curl >/dev/null 2>&1; then
          curl -L \"\$JDK_URL\" -o /tmp/jdk21.tar.gz
        elif command -v wget >/dev/null 2>&1; then
          wget -O /tmp/jdk21.tar.gz \"\$JDK_URL\"
        else
          echo \"ERROR: neither curl nor wget available to download JDK. Set JAVA_HOME_DOCKER manually.\" && exit 1
        fi
        tar -xzf /tmp/jdk21.tar.gz -C \"\$TMP_JDK\" --strip-components=1
        export JAVA_HOME=\"\$TMP_JDK\"
        export PATH=\"\$JAVA_HOME/bin:\$PATH\"
      fi

      JBIN=\$(command -v javac || true)
      if [ -z \"\$JBIN\" ]; then
        echo \"ERROR: javac still not found in container $c\" && exit 1
      fi
      export JAVA_HOME=\$(cd \$(dirname \"\$JBIN\")/../.. && pwd)
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    fi
    cd \"$APP_PATH\"
    chmod +x scripts/build-apk.sh
    ./scripts/build-apk.sh
  "
  echo "== Done in $c =="
}

for c in $CONTAINERS; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${c}\$"; then
    echo "WARN: container ${c} not running, skip."
    continue
  fi
  run_in_container "$c"
done
