interface LiveWorkbookBannerProps {
  isLive: boolean
  isLoading: boolean
  sourceFile: string | null
  updatedAt: string | null
  error: string | null
}

export function LiveWorkbookBanner({
  isLive,
  isLoading,
  sourceFile,
  updatedAt,
  error,
}: LiveWorkbookBannerProps) {
  if (isLive && !error) {
    return null
  }

  if (!isLoading && !error) {
    return null
  }

  const tone = error ? 'warning' : 'info'

  return (
    <aside className={`live-banner ${tone}`}>
      <strong>{isLive ? 'Dev live sync active' : isLoading ? 'Connecting to workbook' : 'Live sync fallback'}</strong>
      <span>
        {isLive
          ? `Source: ${sourceFile ?? 'KPI_TEST_DASHBOARD.xlsx'}`
          : error ?? 'Waiting for workbook data.'}
      </span>
      <span>{updatedAt ? `Last workbook update: ${updatedAt}` : 'Polling workbook every 5 seconds.'}</span>
    </aside>
  )
}
