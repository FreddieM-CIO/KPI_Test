# KPI Dashboard Operations Runbook

## Ownership
- Product Owner: IT Operations Lead
- Engineering Owner: Frontend Platform Team
- Data Steward: IT PMO Analyst

## Environments
- `dev`: active development and integration testing
- `uat`: user acceptance testing and business signoff
- `prod`: live reporting environment

## Data Refresh Cadence
1. Weekly export from `KPI_TEST_DASHBOARD.xlsx`
2. Convert workbook rows to CSV format
3. Update `src/data/kpiSnapshot.ts`
4. Run `npm run test:run` and `npm run build`
5. Merge and deploy

## Release Checklist
1. CI passes (`lint`, `test`, `build`)
2. Validate dashboard loads and filters work
3. Validate one drilldown route
4. Verify On Track / At Risk / Off Track totals
5. Capture release notes in PR description
6. Promote `dev -> uat -> main` without skipping environments

## Promotion Flow
1. Merge approved feature work into `dev`
2. Validate `dev` deployment
3. Raise PR from `dev` to `uat`
4. Complete UAT signoff in the `uat` environment
5. Raise PR from `uat` to `main`
6. Approve and release to `prod`

## Rollback
1. Re-deploy previous successful build artifact
2. Restore previous data snapshot commit
3. Announce rollback and log root cause

## Phase-2 Backlog
1. Alerting for status flips
2. CSV/PDF export from UI
3. Role-based dashboard views
4. Direct workbook upload endpoint
