param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'uat', 'main')]
  [string]$SourceBranch,

  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'uat', 'main')]
  [string]$TargetBranch
)

$ErrorActionPreference = 'Stop'

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

$status = & git -C $repoRoot status --porcelain
if ($status) {
  throw "Cannot promote with a dirty worktree. Commit or stash changes first."
}

$localBranches = (& git -C $repoRoot branch --format='%(refname:short)').ForEach({ $_.Trim() }) | Where-Object { $_ }
foreach ($branch in @($SourceBranch, $TargetBranch)) {
  if ($localBranches -notcontains $branch) {
    throw "Missing local branch: $branch"
  }
}

& git -C $repoRoot checkout $TargetBranch
& git -C $repoRoot merge --ff-only $SourceBranch

Write-Host "Promoted $SourceBranch -> $TargetBranch"
Write-Host "Next step: push $TargetBranch to origin when ready."
