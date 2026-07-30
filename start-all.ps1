# Start All Apps in separate terminal windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting ALL apps..." -ForegroundColor Green
Write-Host " COG (Web)  -> http://localhost:9002" -ForegroundColor Yellow
Write-Host " Inventory  -> http://localhost:9003" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# Open COG/Web in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; `$Host.UI.RawUI.WindowTitle = 'COG / Web App (Port 9002)'; npm run dev:web"

# Open Inventory in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; `$Host.UI.RawUI.WindowTitle = 'Inventory App (Port 9003)'; npm run dev:inventory"

Write-Host "Both apps are starting in separate windows." -ForegroundColor Green
