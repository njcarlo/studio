#!/bin/sh
# Firebase App Hosting build for the monorepo Next.js app (apps/web).
# Invoked via root package.json "apphosting:build".
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[apphosting-build] install workspaces"
HUSKY=0 npm install --workspaces --include-workspace-root

echo "[apphosting-build] prisma generate"
npx prisma generate --schema=prisma/schema.prisma

echo "[apphosting-build] next build"
cd apps/web
node ../../node_modules/next/dist/bin/next build

STANDALONE="apps/web/.next/standalone/apps/web"
# paths relative to apps/web after cd above
STANDALONE_REL=".next/standalone/apps/web"
STATIC_SRC=".next/static"
PUBLIC_SRC="public"

if [ ! -f "$STANDALONE_REL/server.js" ]; then
  echo "[apphosting-build] ERROR: missing $STANDALONE_REL/server.js" >&2
  exit 1
fi

echo "[apphosting-build] copy public + static into standalone"
mkdir -p "$STANDALONE_REL/public" "$STANDALONE_REL/.next/static"
# Use trailing /. so contents merge into existing dirs (never nest as static/static).
rm -rf "$STANDALONE_REL/public"/* "$STANDALONE_REL/public"/.[!.]* 2>/dev/null || true
rm -rf "$STANDALONE_REL/.next/static"/* "$STANDALONE_REL/.next/static"/.[!.]* 2>/dev/null || true
cp -a "$PUBLIC_SRC"/. "$STANDALONE_REL/public/"
cp -a "$STATIC_SRC"/. "$STANDALONE_REL/.next/static/"

SRC_COUNT="$(find "$STATIC_SRC" -type f | wc -l | tr -d ' ')"
DST_COUNT="$(find "$STANDALONE_REL/.next/static" -type f | wc -l | tr -d ' ')"
echo "[apphosting-build] static files src=$SRC_COUNT dst=$DST_COUNT"

if [ "$DST_COUNT" -lt 1 ] || [ "$DST_COUNT" -lt "$SRC_COUNT" ]; then
  echo "[apphosting-build] ERROR: standalone static copy incomplete ($DST_COUNT < $SRC_COUNT)" >&2
  exit 1
fi

# Shared app chunk used by dashboard / most authenticated routes — must exist.
if ! find "$STANDALONE_REL/.next/static/chunks" -name '2758-*.js' | grep -q .; then
  echo "[apphosting-build] WARNING: no chunks/2758-*.js found (ok if webpack renumbered); listing chunk count"
fi
CHUNK_COUNT="$(find "$STANDALONE_REL/.next/static/chunks" -name '*.js' | wc -l | tr -d ' ')"
echo "[apphosting-build] js chunks=$CHUNK_COUNT"
if [ "$CHUNK_COUNT" -lt 20 ]; then
  echo "[apphosting-build] ERROR: suspiciously few JS chunks ($CHUNK_COUNT)" >&2
  exit 1
fi

echo "[apphosting-build] copy prisma into standalone node_modules"
cd "$ROOT"
mkdir -p apps/web/.next/standalone/node_modules
cp -a node_modules/.prisma apps/web/.next/standalone/node_modules/ 2>/dev/null || true
cp -a node_modules/@prisma apps/web/.next/standalone/node_modules/
mkdir -p apps/web/.next/standalone/prisma
cp prisma/schema.prisma apps/web/.next/standalone/prisma/schema.prisma

# Idempotent C2S QA account seed (Workers + roles + demo groups).
# Gated by QA_SEED_ON_DEPLOY=true in apphosting.yaml — turn off after first success.
if [ "${QA_SEED_ON_DEPLOY:-}" = "true" ]; then
  echo "[apphosting-build] seeding C2S QA accounts (QA_SEED_ON_DEPLOY=true)"
  if npx tsx scripts/seed-qa-accounts-core.ts; then
    echo "[apphosting-build] QA seed ok"
  else
    echo "[apphosting-build] WARNING: QA seed failed (deploy continues)" >&2
  fi
fi

echo "[apphosting-build] done"
