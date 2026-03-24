export type KpiCondition = '>=' | '<=' | '='

export type KpiWorkbookStatus = 'Met' | 'Not Met'

export type KpiHealth = 'On Track' | 'At Risk' | 'Off Track'

export interface KpiRecord {
  id: string
  category: string
  kpi: string
  targetDisplay: string
  targetValue: number
  condition: KpiCondition
  actual: number
  scorePct: number
  workbookStatus: KpiWorkbookStatus
  status: KpiHealth
  notes: string
  team: string
  owner: string
  frequency: 'Weekly' | 'Biweekly' | 'Monthly'
  lastUpdated: string
}

export interface TrendPoint {
  period: string
  actual: number
  target: number
}

