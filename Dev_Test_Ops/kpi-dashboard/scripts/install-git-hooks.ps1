$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
$hooksPath = 'Dev_Test_Ops/kpi-dashboard/.githooks'

& git -C $repoRoot config core.hooksPath $hooksPath

Write-Host "Configured git hooks path: $hooksPath"
Write-Host 'Automatic environment versioning will now run on dashboard commits.'
