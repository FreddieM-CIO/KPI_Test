interface MetricDeltaProps {
  value: number
}

export function MetricDelta({ value }: MetricDeltaProps) {
  const signed = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
  const tone = value >= 0 ? 'positive' : 'negative'
  return <span className={`metric-delta ${tone}`}>{signed}%</span>
}

