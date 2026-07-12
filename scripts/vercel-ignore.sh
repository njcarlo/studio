#!/bin/sh
# Always skip Vercel builds. Hosting for apps/web is Firebase App Hosting
# (apphosting.yaml). Exit 0 = ignore this build (Vercel convention).
echo "Skipping Vercel build — deploy target is Firebase App Hosting (cog-app-studio)."
exit 0
