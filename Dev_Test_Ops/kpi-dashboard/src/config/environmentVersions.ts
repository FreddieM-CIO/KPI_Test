import type { AppEnvironment } from './appConfig'

export interface EnvironmentVersionInfo {
  version: string
  updatedAt: string
  notes: string
}

export const environmentVersions: Record<AppEnvironment, EnvironmentVersionInfo> = {
  dev: {
    version: '1.0.1',
    updatedAt: '2026-03-23',
    notes: 'Environment version control and workbook source mapping',
  },
  uat: {
    version: '1.0.1',
    updatedAt: '2026-03-23',
    notes: 'Promoted release version 1.0.1 from dev to uat',
  },
  prod: {
    version: '1.0.1',
    updatedAt: '2026-03-23',
    notes: 'Promoted release version 1.0.1 from uat to prod',
  },
}
