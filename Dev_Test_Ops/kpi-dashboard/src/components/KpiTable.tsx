import { Link } from 'react-router-dom'
import type { KpiRecord } from '../types/kpi'
import { StatusBadge } from './StatusBadge'

interface KpiTableProps {
  records: KpiRecord[]
}

export function KpiTable({ records }: KpiTableProps) {
  if (records.length === 0) {
    return <div className="panel">No KPI rows match the selected filters.</div>
  }

  return (
    <section className="panel">
      <h2>KPI Detail Table</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>KPI</th>
              <th>Category</th>
              <th>Team</th>
              <th>Target</th>
              <th>Actual</th>
              <th>Score</th>
              <th>Status</th>
              <th>Drilldown</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.kpi}</td>
                <td>{record.category}</td>
                <td>{record.team}</td>
                <td>{record.targetDisplay}</td>
                <td>{record.actual}</td>
                <td>{record.scorePct.toFixed(1)}%</td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                <td>
                  <Link to={`/kpi/${record.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

