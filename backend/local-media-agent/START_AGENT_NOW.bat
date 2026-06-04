@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\pythonw.exe" (
  echo Agent is not installed yet. Run INSTALL_ON_COMPANY_PC.ps1 first.
  pause
  exit /b 1
)
start "" ".venv\Scripts\pythonw.exe" "app.py"
echo ABK Local Media Agent started.
