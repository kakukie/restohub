#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
APP_SERVICES="${APP_SERVICES:-app1 app2}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx-proxy}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180}"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' not found in PATH"; exit 1; }
}

wait_healthy() {
  local service="$1"
  local timeout="$2"
  local start_ts now_ts elapsed status cid

  cid="$(docker compose -f "$COMPOSE_FILE" ps -q "$service")"
  if [ -z "$cid" ]; then
    echo "ERROR: no container found for service '$service'"
    exit 1
  fi

  start_ts="$(date +%s)"
  while true; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid")"
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      echo "Service '$service' is $status"
      break
    fi
    now_ts="$(date +%s)"
    elapsed="$((now_ts - start_ts))"
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "ERROR: timeout waiting for '$service' to become healthy/running (last status: $status)"
      exit 1
    fi
    sleep 3
  done
}

need docker

echo "== Preflight =="
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: compose file not found: $COMPOSE_FILE"
  exit 1
fi

echo "== Pulling latest code assets is expected before this script =="
echo "== Building app image =="
docker compose -f "$COMPOSE_FILE" build $APP_SERVICES

for svc in $APP_SERVICES; do
  echo "== Rolling update: $svc =="
  docker compose -f "$COMPOSE_FILE" up -d --no-deps "$svc"
  wait_healthy "$svc" "$WAIT_TIMEOUT"
done

echo "== Reloading nginx proxy =="
docker compose -f "$COMPOSE_FILE" up -d --no-deps "$NGINX_SERVICE"

echo "== Done =="
docker compose -f "$COMPOSE_FILE" ps
