$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
$trackedProjectPath = 'Dev_Test_Ops/kpi-dashboard/package.json'

$tracked = $true
$null = cmd /c "git -C ""$repoRoot"" ls-files --error-unmatch -- ""$trackedProjectPath"" 1>nul 2>nul"
if ($LASTEXITCODE -ne 0) {
  $tracked = $false
}

$branches = (& git -C $repoRoot branch --format='%(refname:short)').ForEach({ $_.Trim() }) | Where-Object { $_ }

Write-Host "Repo root: $repoRoot"
Write-Host "Project tracked by git: $tracked"
Write-Host "Local branches: $($branches -join ', ')"

if (-not $tracked) {
  Write-Host "Promotion not ready: Dev_Test_Ops/kpi-dashboard is not tracked in the parent repo yet."
  exit 1
}

if ($branches -notcontains 'dev' -or $branches -notcontains 'uat' -or $branches -notcontains 'main') {
  Write-Host "Promotion not ready: expected branches dev, uat, and main."
  exit 1
}

Write-Host 'Promotion readiness checks passed.'
