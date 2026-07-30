@echo off
title Studio - Starting All Apps
echo ========================================
echo  Starting ALL apps...
echo  COG (Web)  -> http://localhost:9002
echo  Inventory  -> http://localhost:9003
echo  C2S Church -> http://localhost:9004
echo ========================================

cd /d "%~dp0"

start "COG / Web App (Port 9002)" cmd /k "npm run dev:web"
start "Inventory App (Port 9003)" cmd /k "npm run dev:inventory"
start "C2S Church Website (Port 9004)" cmd /k "npm run dev:c2s"

echo All apps are starting in separate windows.
pause
