# KPI Rule Definitions

Workbook source logic (from `KPI_TEST_DASHBOARD.xlsx`):
- Score formula: `(Actual / Target) * 100`
- Workbook status formula:
1. If `Condition` is `>=`, `Actual >= Target` means `Met`
2. If `Condition` is `<=`, `Actual <= Target` means `Met`
3. If `Condition` is `=`, `Actual === Target` means `Met`

Application health mapping:
1. `Met` and score `>= 95` => `On Track`
2. `Not Met` and score `>= 90` => `At Risk`
3. All other cases => `Off Track`

Examples:
1. `Target 95`, `Actual 95`, `>=` => `Met`, `On Track`
2. `Target 100`, `Actual 99`, `>=` => `Not Met`, `At Risk`
3. `Target 100`, `Actual 10`, `>=` => `Not Met`, `Off Track`

