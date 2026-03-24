import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { KpiRecord } from '../../types/kpi'

interface CategoryComparisonChartProps {
  records: KpiRecord[]
}

export function CategoryComparisonChart({ records }: CategoryComparisonChartProps) {
  const categoryScores = records.reduce<Record<string, { total: number; count: number }>>((acc, record) => {
    if (!acc[record.category]) {
      acc[record.category] = { total: 0, count: 0 }
    }
    acc[record.category].total += record.scorePct
    acc[record.category].count += 1
    return acc
  }, {})

  const data = Object.entries(categoryScores).map(([category, aggregate]) => ({
    category,
    avgScore: Number((aggregate.total / aggregate.count).toFixed(1)),
  }))

  return (
    <section className="panel chart-panel">
      <h2>Category Comparison</h2>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-8} height={48} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgScore" fill="#2a9d8f" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

