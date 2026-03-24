$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root '.local-runtime'
$targets = 'dev', 'uat', 'prod'

foreach ($name in $targets) {
  $pidFile = Join-Path $runtimeDir "$name.pid"
  if (-not (Test-Path $pidFile)) {
    Write-Host "$name is not running"
    continue
  }

  $savedPid = Get-Content $pidFile -ErrorAction SilentlyContinue
  if ($savedPid -and (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $savedPid -Force
    Write-Host "Stopped $name (PID $savedPid)"
  } else {
    Write-Host "$name was not running"
  }

  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}
