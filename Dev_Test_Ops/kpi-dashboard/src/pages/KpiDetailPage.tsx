import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { TrendChart } from '../components/charts/TrendChart'
import { buildTrendSeries } from '../services/kpiData'
import { useKpiRecords } from '../hooks/useKpiRecords'

export function KpiDetailPage() {
  const { kpiId } = useParams()
  const { isLoading, records } = useKpiRecords()
  const selected = records.find((record) => record.id === kpiId)

  if (isLoading && !selected) {
    return (
      <section className="panel">
        <h2>Loading KPI</h2>
        <p>Refreshing the workbook-backed KPI data for this detail view.</p>
      </section>
    )
  }

  if (!selected) {
    return (
      <section className="panel">
        <h2>KPI not found</h2>
        <p>The requested KPI ID does not exist in the current dataset.</p>
        <Link to="/">Return to dashboard</Link>
      </section>
    )
  }

  return (
    <div className="detail-grid">
      <section className="panel">
        <p className="eyebrow">{selected.category}</p>
        <h2>{selected.kpi}</h2>
        <div className="detail-meta">
          <StatusBadge status={selected.status} />
          <span>Owner: {selected.owner}</span>
          <span>Team: {selected.team}</span>
          <span>Updated: {selected.lastUpdated}</span>
        </div>
        <dl className="detail-stats">
          <div>
            <dt>Condition</dt>
            <dd>{selected.condition}</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>{selected.targetDisplay}</dd>
          </div>
          <div>
            <dt>Actual</dt>
            <dd>{selected.actual}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{selected.scorePct.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>Workbook Status</dt>
            <dd>{selected.workbookStatus}</dd>
          </div>
          <div>
            <dt>Frequency</dt>
            <dd>{selected.frequency}</dd>
          </div>
        </dl>
        <p>{selected.notes || 'No additional notes were provided in the source workbook.'}</p>
        <Link to="/">Back to dashboard</Link>
      </section>
      <TrendChart title="KPI Performance Trend" series={buildTrendSeries(selected)} />
    </div>
  )
}
