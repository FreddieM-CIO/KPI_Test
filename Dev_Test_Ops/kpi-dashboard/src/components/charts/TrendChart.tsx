import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../../types/kpi'

interface TrendChartProps {
  series: TrendPoint[]
  title?: string
}

export function TrendChart({ series, title = 'Actual vs Target Trend' }: TrendChartProps) {
  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="target" stroke="#1d3557" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#e76f51" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

