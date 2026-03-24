import type { KpiCondition, KpiHealth, KpiWorkbookStatus } from '../types/kpi'

export function evaluateWorkbookStatus(
  condition: KpiCondition,
  target: number,
  actual: number,
): KpiWorkbookStatus {
  if (condition === '>=') {
    return actual >= target ? 'Met' : 'Not Met'
  }
  if (condition === '<=') {
    return actual <= target ? 'Met' : 'Not Met'
  }
  return actual === target ? 'Met' : 'Not Met'
}

export function calculateScorePct(target: number, actual: number): number {
  if (target === 0) {
    return 0
  }
  return Number(((actual / target) * 100).toFixed(2))
}

export function toHealthStatus(
  workbookStatus: KpiWorkbookStatus,
  scorePct: number,
): KpiHealth {
  if (workbookStatus === 'Not Met') {
    return scorePct >= 90 ? 'At Risk' : 'Off Track'
  }
  return scorePct >= 95 ? 'On Track' : 'At Risk'
}

export function normalizeStatus(
  condition: KpiCondition,
  target: number,
  actual: number,
): { workbookStatus: KpiWorkbookStatus; scorePct: number; status: KpiHealth } {
  const workbookStatus = evaluateWorkbookStatus(condition, target, actual)
  const scorePct = calculateScorePct(target, actual)
  return {
    workbookStatus,
    scorePct,
    status: toHealthStatus(workbookStatus, scorePct),
  }
}

