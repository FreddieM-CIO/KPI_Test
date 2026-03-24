import Papa, { type ParseResult } from 'papaparse'
import { z } from 'zod'
import { appConfig, type AppEnvironment } from '../config/appConfig'
import { kpiSnapshots, workbookCsvSnapshots } from '../data/kpiSnapshot'
import type { KpiCondition, KpiRecord, TrendPoint } from '../types/kpi'
import { normalizeStatus } from '../utils/kpiRules'

const snapshotSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  kpi: z.string().min(1),
  targetDisplay: z.string().min(1),
  targetValue: z.number(),
  condition: z.enum(['>=', '<=', '=']),
  actual: z.number(),
  scorePct: z.number(),
  workbookStatus: z.enum(['Met', 'Not Met']),
  notes: z.string(),
  team: z.string().min(1),
  owner: z.string().min(1),
  frequency: z.enum(['Weekly', 'Biweekly', 'Monthly']),
  lastUpdated: z.string().date(),
})

const csvRowSchema = z.object({
  Category: z.string().min(1),
  KPI: z.string().min(1),
  'Target (Display)': z.string().min(1),
  'Target Value': z.coerce.number(),
  Condition: z.enum(['>=', '<=', '=']),
  Actual: z.coerce.number(),
  'Score (%)': z.coerce.number(),
  Status: z.enum(['Met', 'Not Met']),
  Notes: z.string().optional().default(''),
})

const recordSchema = snapshotSchema.extend({
  status: z.enum(['On Track', 'At Risk', 'Off Track']),
})

const liveWorkbookPayloadSchema = z.object({
  records: z.array(recordSchema),
  sourceFile: z.string().min(1),
  updatedAt: z.string().min(1),
})

export type LiveWorkbookPayload = z.infer<typeof liveWorkbookPayloadSchema>

function inferTeam(category: string): { team: string; owner: string } {
  if (category === 'Project Delivery') {
    return { team: 'PMO', owner: 'Jordan Kim' }
  }
  if (category === 'Support Performance') {
    return { team: 'Service Desk', owner: 'Morgan Lee' }
  }
  if (category === 'Asset Management') {
    return { team: 'Endpoint Ops', owner: 'Avery Patel' }
  }
  if (category === 'Technology & Advisory') {
    return { team: 'Architecture', owner: 'Riley Gomez' }
  }
  return { team: 'Governance', owner: 'Sam Nguyen' }
}

export function loadSnapshotKpis(environment: AppEnvironment = appConfig.environment): KpiRecord[] {
  return kpiSnapshots[environment].map((row) => {
    const parsed = snapshotSchema.parse(row)
    return {
      ...parsed,
      status: normalizeStatus(parsed.condition, parsed.targetValue, parsed.actual).status,
    }
  })
}

export function loadDefaultKpis(): KpiRecord[] {
  return loadSnapshotKpis(appConfig.environment)
}

export function parseKpiCsv(csvText: string): KpiRecord[] {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  }) as ParseResult<Record<string, string>>

  return data.map((rawRow, index) => {
    const row = csvRowSchema.parse(rawRow)
    const normalized = normalizeStatus(
      row.Condition as KpiCondition,
      row['Target Value'],
      row.Actual,
    )
    const ownerContext = inferTeam(row.Category)

    return {
      id: `csv-${String(index + 1).padStart(3, '0')}`,
      category: row.Category,
      kpi: row.KPI,
      targetDisplay: row['Target (Display)'],
      targetValue: row['Target Value'],
      condition: row.Condition as KpiCondition,
      actual: row.Actual,
      scorePct: normalized.scorePct,
      workbookStatus: normalized.workbookStatus,
      status: normalized.status,
      notes: row.Notes ?? '',
      team: ownerContext.team,
      owner: ownerContext.owner,
      frequency: 'Weekly',
      lastUpdated: '2026-03-23',
    } satisfies KpiRecord
  })
}

export function loadWorkbookBridgeData(environment: AppEnvironment = appConfig.environment): KpiRecord[] {
  return parseKpiCsv(workbookCsvSnapshots[environment])
}

export async function fetchLiveWorkbookKpis(): Promise<LiveWorkbookPayload> {
  const response = await fetch('/api/dev/workbook-kpis', {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Live workbook sync failed with status ${response.status}.`)
  }

  const payload = await response.json()
  return liveWorkbookPayloadSchema.parse(payload)
}

export function validateKpis(records: KpiRecord[]): string[] {
  const issues: string[] = []

  for (const record of records) {
    if (record.targetValue < 0 || record.actual < 0) {
      issues.push(`${record.id}: target/actual cannot be negative.`)
    }
    if (record.scorePct > 2000) {
      issues.push(`${record.id}: suspicious score above 2000%.`)
    }
    if (record.lastUpdated.length !== 10) {
      issues.push(`${record.id}: lastUpdated must be YYYY-MM-DD.`)
    }
  }

  return issues
}

export function buildTrendSeries(record: KpiRecord): TrendPoint[] {
  const seed = Array.from(record.id).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

  return months.map((month, idx) => {
    const wave = ((seed + idx * 13) % 9) - 4
    const direction = record.condition === '<=' ? -1 : 1
    const normalizedShift = wave * (record.targetValue >= 50 ? 0.8 : 0.15)
    const actual = Number((record.actual - direction * normalizedShift).toFixed(2))
    return {
      period: month,
      target: record.targetValue,
      actual: actual < 0 ? 0 : actual,
    }
  })
}
