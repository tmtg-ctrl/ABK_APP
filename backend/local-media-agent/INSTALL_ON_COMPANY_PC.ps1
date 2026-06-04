$ErrorActionPreference = 'Stop'

$agentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Get-Command python -ErrorAction SilentlyContinue

if (-not $python) {
  throw 'Python was not found. Install Python 3.11+ from https://www.python.org/downloads/windows/ and tick "Add python.exe to PATH".'
}

Set-Location $agentDir

if (-not (Test-Path '.venv')) {
  python -m venv .venv
}

.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\pip.exe install -r requirements.txt

if (-not (Test-Path '.env')) {
  $token = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Minimum 0 -Maximum 16) })
  @"
MEDIA_AGENT_TOKEN=$token
MEDIA_AGENT_HOST=127.0.0.1
MEDIA_AGENT_PORT=5055
MEDIA_AGENT_ALLOWED_ROOTS=D:\
"@ | Set-Content -Encoding ASCII '.env'
}

$pythonw = Join-Path $agentDir '.venv\Scripts\pythonw.exe'
if (-not (Test-Path $pythonw)) {
  throw "pythonw.exe was not found at $pythonw"
}

$startup = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startup 'ABK Local Media Agent.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $pythonw
$shortcut.Arguments = 'app.py'
$shortcut.WorkingDirectory = $agentDir
$shortcut.WindowStyle = 7
$shortcut.Description = 'Runs ABK Local Media Agent for D:\ media folders.'
$shortcut.Save()

$running = Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*local-media-agent*app.py*' }

if (-not $running) {
  Start-Process -FilePath $pythonw -ArgumentList 'app.py' -WorkingDirectory $agentDir -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

$health = Invoke-RestMethod -Uri 'http://127.0.0.1:5055/health'
$envValues = Get-Content '.env' | ConvertFrom-StringData

Write-Host ''
Write-Host 'ABK Local Media Agent installed successfully.' -ForegroundColor Green
Write-Host "Health: $($health.status)"
Write-Host "Local URL: http://127.0.0.1:5055"
Write-Host "Startup shortcut: $shortcutPath"
Write-Host ''
Write-Host 'Use this token when configuring Vercel MEDIA_AGENT_TOKEN:' -ForegroundColor Yellow
Write-Host $envValues.MEDIA_AGENT_TOKEN
