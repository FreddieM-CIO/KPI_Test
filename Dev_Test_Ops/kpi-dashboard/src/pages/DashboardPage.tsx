import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterBar, type DashboardFilters } from '../components/FilterBar'
import { KpiCard } from '../components/KpiCard'
import { KpiTable } from '../components/KpiTable'
import { LiveWorkbookBanner } from '../components/LiveWorkbookBanner'
import { ValidationBanner } from '../components/ValidationBanner'
import { CategoryComparisonChart } from '../components/charts/CategoryComparisonChart'
import { StatusDistributionChart } from '../components/charts/StatusDistributionChart'
import { TrendChart } from '../components/charts/TrendChart'
import { appConfig } from '../config/appConfig'
import { buildTrendSeries } from '../services/kpiData'
import { useKpiRecords } from '../hooks/useKpiRecords'
import type { KpiRecord } from '../types/kpi'

function withFilters(records: KpiRecord[], filters: DashboardFilters): KpiRecord[] {
  return records.filter((record) => {
    const searchMatches =
      filters.search.trim().length === 0 ||
      record.kpi.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.owner.toLowerCase().includes(filters.search.toLowerCase())
    const teamMatches = filters.team === 'all' || record.team === filters.team
    const categoryMatches = filters.category === 'all' || record.category === filters.category
    const statusMatches = filters.status === 'all' || record.status === filters.status
    return searchMatches && teamMatches && categoryMatches && statusMatches
  })
}

function getSummary(records: KpiRecord[]) {
  const total = records.length
  const onTrack = records.filter((record) => record.status === 'On Track').length
  const atRisk = records.filter((record) => record.status === 'At Risk').length
  const offTrack = records.filter((record) => record.status === 'Off Track').length
  const avgScore = records.reduce((sum, record) => sum + record.scorePct, 0) / (total || 1)

  return { total, onTrack, atRisk, offTrack, avgScore: Number(avgScore.toFixed(1)) }
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { records, issues, isLoading, isLive, liveError, liveSource, liveUpdatedAt } = useKpiRecords()

  const filters = useMemo(
    (): DashboardFilters => ({
      search: searchParams.get('search') ?? '',
      team: searchParams.get('team') ?? 'all',
      status: searchParams.get('status') ?? 'all',
      category: searchParams.get('category') ?? 'all',
    }),
    [searchParams],
  )

  const filtered = useMemo(() => withFilters(records, filters), [records, filters])
  const summary = useMemo(() => getSummary(filtered), [filtered])
  const trendSeries = useMemo(() => (filtered[0] ? buildTrendSeries(filtered[0]) : []), [filtered])
  const teams = useMemo(() => Array.from(new Set(records.map((record) => record.team))), [records])
  const categories = useMemo(
    () => Array.from(new Set(records.map((record) => record.category))),
    [records],
  )
  const scoreLabel = appConfig.environment === 'dev' ? 'Corpoate Score' : 'Average Score'

  function setFilters(nextFilters: DashboardFilters) {
    const next = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        next.set(key, value)
      }
    })
    setSearchParams(next)
  }

  return (
    <div className="dashboard-grid">
      <LiveWorkbookBanner
        error={liveError}
        isLive={isLive}
        isLoading={isLoading}
        sourceFile={liveSource}
        updatedAt={liveUpdatedAt}
      />
      <ValidationBanner issues={issues} />
      <section className="summary-strip">
        <article className="summary-tile">
          <span>Total KPIs</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="summary-tile">
          <span>On Track</span>
          <strong>{summary.onTrack}</strong>
        </article>
        <article className="summary-tile">
          <span>At Risk</span>
          <strong>{summary.atRisk}</strong>
        </article>
        <article className="summary-tile">
          <span>Off Track</span>
          <strong>{summary.offTrack}</strong>
        </article>
        <article className="summary-tile">
          <span>{scoreLabel}</span>
          <strong>{summary.avgScore}%</strong>
        </article>
      </section>

      <FilterBar filters={filters} teams={teams} categories={categories} onChange={setFilters} />

      <section className="kpi-card-grid">
        {isLoading && filtered.length === 0 ? (
          <div className="panel">Loading workbook data from the dev source file...</div>
        ) : (
          filtered.map((record) => <KpiCard key={record.id} record={record} />)
        )}
      </section>

      <div className="chart-grid">
        <TrendChart series={trendSeries} />
        <StatusDistributionChart records={filtered} />
        <CategoryComparisonChart records={filtered} />
      </div>

      <KpiTable records={filtered} />
    </div>
  )
}
