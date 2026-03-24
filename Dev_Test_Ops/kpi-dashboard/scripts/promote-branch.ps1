param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'uat', 'main')]
  [string]$SourceBranch,

  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'uat', 'main')]
  [string]$TargetBranch
)

$ErrorActionPreference = 'Stop'
$nodePath = 'C:\Program Files\nodejs\node.exe'
$npmPath = 'C:\Program Files\nodejs\npm.cmd'

if (
  ($SourceBranch -eq 'dev' -and $TargetBranch -ne 'uat') -or
  ($SourceBranch -eq 'uat' -and $TargetBranch -ne 'main') -or
  ($SourceBranch -eq 'main')
) {
  throw "Supported promotions are dev -> uat and uat -> main."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
$trackedProjectPath = 'Dev_Test_Ops/kpi-dashboard/package.json'

$null = cmd /c "git -C ""$repoRoot"" ls-files --error-unmatch -- ""$trackedProjectPath"" 1>nul 2>nul"
if ($LASTEXITCODE -ne 0) {
  throw "Cannot promote yet: Dev_Test_Ops/kpi-dashboard is not tracked by git in $repoRoot."
}

$status = & git -C $repoRoot status --porcelain --untracked-files=no
if ($status) {
  throw "Cannot promote with a dirty worktree. Commit or stash changes first."
}

$localBranches = (& git -C $repoRoot branch --format='%(refname:short)').ForEach({ $_.Trim() }) | Where-Object { $_ }
foreach ($branch in @($SourceBranch, $TargetBranch)) {
  if ($localBranches -notcontains $branch) {
    throw "Missing local branch: $branch"
  }
}

if ($SourceBranch -eq 'dev' -and $TargetBranch -eq 'uat') {
  & git -C $repoRoot checkout $SourceBranch

  & $nodePath (Join-Path $projectRoot 'scripts\sync-uat-workbook-from-dev.mjs')
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to sync missing workbook data from dev to uat."
  }

  & $npmPath --prefix $projectRoot run snapshot:sync
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to refresh KPI snapshot data after workbook sync."
  }

  $snapshotChanges = & git -C $repoRoot status --porcelain --untracked-files=no -- Dev_Test_Ops/kpi-dashboard/src/data/kpiSnapshot.ts
  if ($snapshotChanges) {
    & git -C $repoRoot add -- Dev_Test_Ops/kpi-dashboard/src/data/kpiSnapshot.ts
    & git -C $repoRoot commit -m "Sync missing KPI workbook data from dev to uat"
  } else {
    Write-Host "No snapshot changes detected after workbook sync."
  }
}

& git -C $repoRoot checkout $TargetBranch
& git -C $repoRoot merge --ff-only $SourceBranch

Write-Host "Promoted $SourceBranch -> $TargetBranch"
Write-Host "Next step: push $TargetBranch to origin when ready."
