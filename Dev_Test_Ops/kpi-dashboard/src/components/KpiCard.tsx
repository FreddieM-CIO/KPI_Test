import { Link } from 'react-router-dom'
import type { KpiRecord } from '../types/kpi'
import { MetricDelta } from './MetricDelta'
import { StatusBadge } from './StatusBadge'

interface KpiCardProps {
  record: KpiRecord
}

export function KpiCard({ record }: KpiCardProps) {
  const delta = record.actual - record.targetValue

  return (
    <article className="kpi-card">
      <div className="kpi-card-header">
        <StatusBadge status={record.status} />
        <span className="kpi-team">{record.team}</span>
      </div>
      <h3>{record.kpi}</h3>
      <p className="kpi-category">{record.category}</p>
      <div className="kpi-metrics">
        <div>
          <span className="metric-label">Target</span>
          <strong>{record.targetDisplay}</strong>
        </div>
        <div>
          <span className="metric-label">Actual</span>
          <strong>{record.actual}</strong>
        </div>
        <div>
          <span className="metric-label">Score</span>
          <strong>{record.scorePct.toFixed(1)}%</strong>
        </div>
      </div>
      <div className="kpi-card-footer">
        <MetricDelta value={delta} />
        <Link to={`/kpi/${record.id}`}>View details</Link>
      </div>
    </article>
  )
}

