#!/bin/sh
# App Hosting / Cloud Run start script for the Next.js standalone server.
#
# Cloud Run injects HOSTNAME=<container-hostname>. Next's standalone server.js
# binds to process.env.HOSTNAME, so without overriding it the process listens
# only on that hostname and the PORT=8080 startup probe fails.
# Force 0.0.0.0 so Cloud Run can reach the server.
set -eu
export HOSTNAME=0.0.0.0
export PORT="${PORT:-8080}"

SERVER="apps/web/.next/standalone/apps/web/server.js"
if [ ! -f "$SERVER" ]; then
  echo "apphosting-start: missing $SERVER" >&2
  echo "apphosting-start: cwd=$(pwd)" >&2
  ls -la apps/web/.next/standalone/apps/web 2>&1 || true
  exit 1
fi

exec node "$SERVER"
