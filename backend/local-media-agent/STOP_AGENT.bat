@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*local-media-agent*app.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo ABK Local Media Agent stopped.
pause
