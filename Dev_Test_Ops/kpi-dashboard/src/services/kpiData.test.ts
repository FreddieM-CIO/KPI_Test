import { describe, expect, it } from 'vitest'
import { loadSnapshotKpis, parseKpiCsv, validateKpis } from './kpiData'

describe('kpiData', () => {
  it('loads snapshot rows', () => {
    const rows = loadSnapshotKpis()
    expect(rows.length).toBeGreaterThan(10)
    expect(rows[0].id).toBeTruthy()
  })

  it('parses CSV rows with workbook columns', () => {
    const csv = `Category,KPI,Target (Display),Target Value,Condition,Actual,Score (%),Status,Notes
Support Performance,Tickets resolved within SLA,≥ 90%,90,>=,95,105.5,Met,all good`
    const [row] = parseKpiCsv(csv)
    expect(row.category).toBe('Support Performance')
    expect(row.status).toBe('On Track')
  })

  it('flags suspicious score data', () => {
    const rows = loadSnapshotKpis()
    const issues = validateKpis([{ ...rows[0], scorePct: 3001 }])
    expect(issues[0]).toContain('suspicious score')
  })
})

