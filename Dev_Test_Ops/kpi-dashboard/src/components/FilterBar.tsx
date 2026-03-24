export interface DashboardFilters {
  search: string
  team: string
  status: string
  category: string
}

interface FilterBarProps {
  filters: DashboardFilters
  teams: string[]
  categories: string[]
  onChange: (nextFilters: DashboardFilters) => void
}

export function FilterBar({ filters, teams, categories, onChange }: FilterBarProps) {
  return (
    <section className="panel filter-panel">
      <h2>Filters</h2>
      <div className="filter-grid">
        <label>
          Search KPI
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Search by KPI text"
          />
        </label>
        <label>
          Team
          <select value={filters.team} onChange={(event) => onChange({ ...filters, team: event.target.value })}>
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => onChange({ ...filters, status: event.target.value })}
          >
            <option value="all">All statuses</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Off Track">Off Track</option>
          </select>
        </label>
      </div>
    </section>
  )
}

