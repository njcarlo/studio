@echo off
title Inventory App (Port 9003)
echo ========================================
echo  Starting INVENTORY App on port 9003
echo  http://localhost:9003
echo ========================================
cd /d "%~dp0"
npm run dev:inventory
pause
