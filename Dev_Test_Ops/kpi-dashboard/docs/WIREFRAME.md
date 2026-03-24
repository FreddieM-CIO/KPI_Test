# Dashboard Information Architecture

## Desktop Wireframe
`Header`  
`Summary strip (Total, On Track, At Risk, Off Track, Avg Score)`  
`Filter panel (search, team, category, status)`  
`KPI card grid`  
`Charts row (Trend, Status Distribution, Category Comparison)`  
`KPI detail table`

## Mobile Wireframe
`Header`  
`Summary strip (wrap)`  
`Filter panel (stacked)`  
`KPI cards (single column)`  
`Charts (stacked)`  
`Table (horizontal scroll)`

## Navigation Flow
1. Dashboard summary loads all KPIs.
2. Filters refine cards/charts/table and sync in URL query params.
3. `View details` opens `/kpi/:id` drilldown page.
4. Drilldown page shows metadata + trend + link back to dashboard.

