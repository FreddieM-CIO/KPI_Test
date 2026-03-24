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
If any KPI workbook changed, refresh the baked snapshots on `dev` first:

```powershell
npm run snapshot:sync
git add Dev_Test_Ops/kpi-dashboard/src/data/kpiSnapshot.ts Dev_Test_Ops/kpi-dashboard/package.json Dev_Test_Ops/kpi-dashboard/scripts/sync-workbook-snapshot.mjs Dev_Test_Ops/kpi-dashboard/docs/BRANCH_PROMOTION.md
git commit -m "Sync KPI snapshots from environment workbooks"
```

`snapshot:sync` refreshes all three baked datasets at once:
- `dev` <- `KPI_TEST_DASHBOARD - Dev.xlsx`
- `uat` <- `KPI_TEST_DASHBOARD - UAT.xlsx`
- `prod` <- `KPI_TEST_DASHBOARD.xlsx`

If this release should carry a new version, update `dev` first:

```powershell
npm run version:dev -- 1.0.1 "Workbook and dashboard updates"
git add Dev_Test_Ops/kpi-dashboard/src/config/environmentVersions.ts
git commit -m "Set dev release version to 1.0.1"
```

Before promoting, copy the validated `dev` version into `uat`:

```powershell
npm run version:promote -- dev uat
git add Dev_Test_Ops/kpi-dashboard/src/config/environmentVersions.ts
git commit -m "Promote release version from dev to uat"
```

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\promote-branch.ps1 -SourceBranch dev -TargetBranch uat
```

## Promote UAT To Prod
Before promoting, copy the signed-off `uat` version into `prod`:

```powershell
npm run version:promote -- uat prod
git add Dev_Test_Ops/kpi-dashboard/src/config/environmentVersions.ts
git commit -m "Promote release version from uat to prod"
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\promote-branch.ps1 -SourceBranch uat -TargetBranch main
```

## Inspect Current Version Map
Run:

```powershell
npm run version:show
```

## Current Repo Note
The dashboard is now tracked in the parent repo and can be promoted through `dev`, `uat`, and `main`.
