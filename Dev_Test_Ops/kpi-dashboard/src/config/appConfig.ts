export type AppEnvironment = 'dev' | 'uat' | 'prod'

function toEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'uat' || value === 'prod') {
    return value
  }
  return 'dev'
}

const environment = toEnvironment(import.meta.env.VITE_ENVIRONMENT)

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? 'KPI IT Dashboard',
  environment,
  dataSource: import.meta.env.VITE_DATA_SOURCE ?? 'workbook_snapshot',
  refreshIntervalMinutes: Number(import.meta.env.VITE_REFRESH_INTERVAL_MINUTES ?? '60'),
  releaseChannel: import.meta.env.VITE_RELEASE_CHANNEL ?? 'internal',
  devRealtimeEnabled: import.meta.env.VITE_DEV_REALTIME_ENABLED === 'true',
}

export function getEnvironmentLabel(env: AppEnvironment): string {
  if (env === 'uat') {
    return 'UAT'
  }
  if (env === 'prod') {
    return 'PROD'
  }
  return 'DEV'
}
