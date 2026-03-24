import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import type { KpiRecord } from '../../types/kpi'

interface StatusDistributionChartProps {
  records: KpiRecord[]
}

const palette: Record<string, string> = {
  'On Track': '#4c956c',
  'At Risk': '#e9c46a',
  'Off Track': '#c44536',
}

export function StatusDistributionChart({ records }: StatusDistributionChartProps) {
  const byStatus = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.status] = (acc[record.status] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(byStatus).map(([status, count]) => ({ status, count }))

  return (
    <section className="panel chart-panel">
      <h2>Status Distribution</h2>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={56} outerRadius={88}>
              {data.map((slice) => (
                <Cell key={slice.status} fill={palette[slice.status] ?? '#264653'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

