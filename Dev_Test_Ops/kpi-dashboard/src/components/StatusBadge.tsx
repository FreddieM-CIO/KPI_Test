import type { KpiHealth } from '../types/kpi'

interface StatusBadgeProps {
  status: KpiHealth
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
}

