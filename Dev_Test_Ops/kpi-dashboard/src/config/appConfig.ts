import { environmentVersions } from './environmentVersions'

export type AppEnvironment = 'dev' | 'uat' | 'prod'

const defaultWorkbookSourcePaths: Record<AppEnvironment, string> = {
  dev: 'C:\\Users\\Fredd\\OneDrive\\Projects_dev\\Dev_Test_Ops\\KPI_TEST_DASHBOARD - Dev.xlsx',
  uat: 'C:\\Users\\Fredd\\OneDrive\\Projects_dev\\Dev_Test_Ops\\KPI_TEST_DASHBOARD - UAT.xlsx',
  prod: 'C:\\Users\\Fredd\\OneDrive\\Projects_dev\\Dev_Test_Ops\\KPI_TEST_DASHBOARD.xlsx',
}

function toEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'uat' || value === 'prod') {
    return value
  }
  return 'dev'
}

const environment = toEnvironment(import.meta.env.VITE_ENVIRONMENT)
const workbookSourcePath =
  import.meta.env.VITE_WORKBOOK_SOURCE_PATH ?? defaultWorkbookSourcePaths[environment]

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? 'KPI IT Dashboard',
  environment,
  dataSource: import.meta.env.VITE_DATA_SOURCE ?? 'workbook_snapshot',
  workbookSourcePath,
  workbookSourceFile: workbookSourcePath.split(/[/\\]/).at(-1) ?? workbookSourcePath,
  releaseVersion: environmentVersions[environment].version,
  releaseUpdatedAt: environmentVersions[environment].updatedAt,
  releaseNotes: environmentVersions[environment].notes,
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
