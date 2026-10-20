Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting VoxSense AI Platform Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "..\backend"
$frontendPath = Join-Path $PSScriptRoot "..\frontend"

Write-Host "`n[1/2] Starting Backend API Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\python.exe run.py"

Start-Sleep -Seconds 2

Write-Host "`n[2/2] Starting Frontend Vite Dev Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`nBoth services launched!" -ForegroundColor Green
Write-Host "Backend API docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "Frontend UI:       http://localhost:5173" -ForegroundColor White
