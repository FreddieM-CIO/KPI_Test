# Branch Promotion Flow

## Supported Promotion Path
1. `dev` -> `uat`
2. `uat` -> `main`

Only fast-forward promotion is supported. That keeps the exact tested commit moving forward without extra merge commits.

If `dev` and `uat` diverge because of environment-version metadata commits, the promotion script now rebases the source branch onto the target branch first so the fast-forward rule still holds.

Version control is now automatic:
- every dashboard commit bumps the current environment revision through the git hook
- every promotion bumps the target environment revision after the fast-forward merge
- version format is `baseVersion-environment.revision`

## Readiness Check
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-promotion-readiness.ps1
```

The readiness script verifies:
- the dashboard project is actually tracked by the parent git repo
- local branches `dev`, `uat`, and `main` exist

## Promote Dev To UAT
The promotion now auto-syncs missing KPI workbook data from:
- `KPI_TEST_DASHBOARD - Dev.xlsx` -> `KPI_TEST_DASHBOARD - UAT.xlsx`

That sync does two things during `dev -> uat`:
- appends KPI rows that exist in the Dev workbook but not in the UAT workbook
- fills blank UAT cells when the Dev workbook already has a value for the same `Category + KPI`

After the workbook sync, the promotion script automatically regenerates `src/data/kpiSnapshot.ts` and commits it on `dev` if the baked UAT snapshot changed.

If you want to run only the workbook sync without a promotion:

```powershell
npm run workbook:sync:uat
```

If any KPI workbook changed and you want to refresh the baked snapshots manually on `dev` first:

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
npm run version:base -- all 1.0.2 "Workbook and dashboard updates"
git add Dev_Test_Ops/kpi-dashboard/src/config/environmentVersions.ts
git commit -m "Set base version to 1.0.2"
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

## Inspect Current Version Map
Run:

```powershell
npm run version:show
```

## Enable Automatic Version Tracking
Run once in the repo:

```powershell
npm run hooks:install
```

## Current Repo Note
The dashboard is now tracked in the parent repo and can be promoted through `dev`, `uat`, and `main`.
