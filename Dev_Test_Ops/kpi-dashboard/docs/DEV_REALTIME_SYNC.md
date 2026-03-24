# Dev Realtime Workbook Sync

## Source File
- `dev`: `C:\Users\Fredd\OneDrive\Projects_dev\Dev_Test_Ops\KPI_TEST_DASHBOARD - Dev.xlsx`
- `uat`: `C:\Users\Fredd\OneDrive\Projects_dev\Dev_Test_Ops\KPI_TEST_DASHBOARD - UAT.xlsx`
- `prod`: `C:\Users\Fredd\OneDrive\Projects_dev\Dev_Test_Ops\KPI_TEST_DASHBOARD.xlsx`

## How It Works
1. The `dev` Vite server exposes `/api/dev/workbook-kpis`
2. That endpoint reads the Excel workbook directly
3. The dashboard polls the endpoint every 5 seconds in `dev`
4. The Vite watcher also pushes a live update event when the workbook file changes
5. `uat` and `prod` continue to use stable snapshot data generated from their own workbook files

## Local Usage
1. Start `dev` with `npm run local:dev` or all environments with `npm run local:start-all`
2. Edit and save `KPI_TEST_DASHBOARD - Dev.xlsx`
3. The `dev` dashboard refreshes from the workbook automatically
