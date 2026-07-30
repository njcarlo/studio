@echo off
title COG / Web App (Port 9002)
echo ========================================
echo  Starting COG (Web) App on port 9002
echo  http://localhost:9002
echo ========================================
cd /d "%~dp0"
npm run dev:web
pause
