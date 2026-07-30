# Start COG / Web App
$Host.UI.RawUI.WindowTitle = "COG / Web App (Port 9002)"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting COG (Web) App on port 9002" -ForegroundColor Green
Write-Host " http://localhost:9002" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot
npm run dev:web
