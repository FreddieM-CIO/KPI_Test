import { describe, expect, it } from 'vitest'
import { calculateScorePct, evaluateWorkbookStatus, toHealthStatus } from './kpiRules'

describe('kpiRules', () => {
  it('evaluates >= conditions', () => {
    expect(evaluateWorkbookStatus('>=', 100, 101)).toBe('Met')
    expect(evaluateWorkbookStatus('>=', 100, 90)).toBe('Not Met')
  })

  it('calculates score percent with fixed precision', () => {
    expect(calculateScorePct(90, 79)).toBe(87.78)
  })

  it('maps workbook status to health status', () => {
    expect(toHealthStatus('Met', 100)).toBe('On Track')
    expect(toHealthStatus('Not Met', 92)).toBe('At Risk')
    expect(toHealthStatus('Not Met', 20)).toBe('Off Track')
  })
})

