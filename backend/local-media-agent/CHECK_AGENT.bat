@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Uri 'http://127.0.0.1:5055/health' | ConvertTo-Json } catch { Write-Host $_.Exception.Message; exit 1 }"
pause
