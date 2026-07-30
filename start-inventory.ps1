# Start Inventory App
$Host.UI.RawUI.WindowTitle = "Inventory App (Port 9003)"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting INVENTORY App on port 9003" -ForegroundColor Green
Write-Host " http://localhost:9003" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot
npm run dev:inventory
