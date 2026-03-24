# Branch Promotion Flow

## Supported Promotion Path
1. `dev` -> `uat`
2. `uat` -> `main`

Only fast-forward promotion is supported. That keeps the exact tested commit moving forward without extra merge commits.

## Readiness Check
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-promotion-readiness.ps1
```

The readiness script verifies:
- the dashboard project is actually tracked by the parent git repo
- local branches `dev`, `uat`, and `main` exist

## Promote Dev To UAT
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\promote-branch.ps1 -SourceBranch dev -TargetBranch uat
```

## Promote UAT To Prod
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\promote-branch.ps1 -SourceBranch uat -TargetBranch main
```

## Current Repo Note
Right now the dashboard lives under `Dev_Test_Ops/kpi-dashboard`, but that path is not yet tracked in the parent repo. Until it is added and committed, branch promotion cannot carry the dashboard changes through git branches.

