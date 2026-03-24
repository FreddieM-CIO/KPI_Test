$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
$worktreeRoot = Join-Path $projectRoot '.local-worktrees'
$nodeModulesPath = Join-Path $projectRoot 'node_modules'

if (-not (Test-Path $worktreeRoot)) {
  New-Item -ItemType Directory -Path $worktreeRoot | Out-Null
}

$targets = @(
  @{ Name = 'dev'; Branch = 'dev' },
  @{ Name = 'uat'; Branch = 'uat' },
  @{ Name = 'prod'; Branch = 'main' }
)

foreach ($target in $targets) {
  $worktreePath = Join-Path $worktreeRoot $target.Name
  $gitMarkerPath = Join-Path $worktreePath '.git'

  if (-not (Test-Path $worktreePath)) {
    & git -C $repoRoot worktree add --detach $worktreePath $target.Branch
  } elseif (-not (Test-Path $gitMarkerPath)) {
    throw "Existing path is not a git worktree: $worktreePath"
  } else {
    & git -C $worktreePath checkout --detach $target.Branch
  }

  $worktreeNodeModulesPath = Join-Path $worktreePath 'node_modules'
  if (-not (Test-Path $worktreeNodeModulesPath)) {
    New-Item -ItemType Junction -Path $worktreeNodeModulesPath -Target $nodeModulesPath | Out-Null
  }

  $currentCommit = (& git -C $worktreePath rev-parse --short HEAD).Trim()
  Write-Host "Prepared $($target.Name) worktree at $worktreePath ($currentCommit)"
}
