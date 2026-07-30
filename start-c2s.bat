@echo off
title C2S Church Website (Port 9004)
echo ========================================
echo  Starting C2S Church Website on port 9004
echo  http://localhost:9004
echo ========================================
cd /d "%~dp0"
npm run dev:c2s
pause
