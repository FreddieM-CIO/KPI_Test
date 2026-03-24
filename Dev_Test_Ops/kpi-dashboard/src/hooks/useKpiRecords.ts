import { startTransition, useEffect, useState } from 'react'
import { appConfig } from '../config/appConfig'
import type { KpiRecord } from '../types/kpi'
import {
  fetchLiveWorkbookKpis,
  loadDefaultKpis,
  validateKpis,
} from '../services/kpiData'

interface UseKpiRecordsResult {
  records: KpiRecord[]
  issues: string[]
  isLoading: boolean
  liveSource: string | null
  liveUpdatedAt: string | null
  liveError: string | null
  isLive: boolean
}

const liveRefreshIntervalMs = 5000

export function useKpiRecords(): UseKpiRecordsResult {
  const [records, setRecords] = useState<KpiRecord[]>(() => loadDefaultKpis())
  const [isLoading, setIsLoading] = useState<boolean>(
    appConfig.environment === 'dev' && appConfig.devRealtimeEnabled,
  )
  const [liveSource, setLiveSource] = useState<string | null>(null)
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<string | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (appConfig.environment !== 'dev' || !appConfig.devRealtimeEnabled) {
      return
    }

    let disposed = false

    async function syncFromWorkbook() {
      try {
        const payload = await fetchLiveWorkbookKpis()
        if (disposed) {
          return
        }

        startTransition(() => {
          setRecords(payload.records)
          setLiveSource(payload.sourceFile)
          setLiveUpdatedAt(payload.updatedAt)
          setLiveError(null)
          setIsLive(true)
          setIsLoading(false)
        })
      } catch (error) {
        if (disposed) {
          return
        }

        const message = error instanceof Error ? error.message : 'Live workbook sync failed.'
        startTransition(() => {
          setRecords(loadDefaultKpis())
          setLiveError(message)
          setIsLive(false)
          setIsLoading(false)
        })
      }
    }

    void syncFromWorkbook()

    const intervalId = window.setInterval(() => {
      void syncFromWorkbook()
    }, liveRefreshIntervalMs)

    const hot = import.meta.hot
    const onWorkbookUpdate = () => {
      void syncFromWorkbook()
    }

    hot?.on('kpi-workbook-updated', onWorkbookUpdate)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      hot?.off('kpi-workbook-updated', onWorkbookUpdate)
    }
  }, [])

  return {
    records,
    issues: validateKpis(records),
    isLoading,
    liveSource,
    liveUpdatedAt,
    liveError,
    isLive,
  }
}
