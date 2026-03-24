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
If the KPI workbook changed, refresh the baked snapshot on `dev` first:

```powershell
npm run snapshot:sync
git add Dev_Test_Ops/kpi-dashboard/src/data/kpiSnapshot.ts Dev_Test_Ops/kpi-dashboard/package.json Dev_Test_Ops/kpi-dashboard/scripts/sync-workbook-snapshot.mjs Dev_Test_Ops/kpi-dashboard/docs/BRANCH_PROMOTION.md
git commit -m "Sync KPI snapshot from workbook"
```

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\promote-branch.ps1 -SourceBranch dev -TargetBranch uat
```

## Promote UAT To Prod
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\promote-branch.ps1 -SourceBranch uat -TargetBranch main
```

## Current Repo Note
The dashboard is now tracked in the parent repo and can be promoted through `dev`, `uat`, and `main`.
