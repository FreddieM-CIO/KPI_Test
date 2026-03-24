$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root '.local-runtime'
$nodePath = 'C:\Program Files\nodejs\npm.cmd'

if (-not (Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir | Out-Null
}

$targets = @(
  @{ Name = 'dev'; Script = 'local:dev'; Port = 4173 },
  @{ Name = 'uat'; Script = 'local:uat'; Port = 4174 },
  @{ Name = 'prod'; Script = 'local:prod'; Port = 4175 }
)

foreach ($target in $targets) {
  $pidFile = Join-Path $runtimeDir "$($target.Name).pid"
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $stdoutLog = Join-Path $runtimeDir "$($target.Name)-$timestamp.out.log"
  $stderrLog = Join-Path $runtimeDir "$($target.Name)-$timestamp.err.log"

  if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
      Write-Host "$($target.Name) already running on port $($target.Port)"
      continue
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  }

  $process = Start-Process `
    -FilePath $nodePath `
    -ArgumentList 'run', $target.Script `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  $process.Id | Set-Content $pidFile
  Write-Host "Started $($target.Name) on http://127.0.0.1:$($target.Port) (PID $($process.Id))"
}
