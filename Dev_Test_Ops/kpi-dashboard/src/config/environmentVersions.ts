import type { AppEnvironment } from './appConfig'

export interface EnvironmentVersionInfo {
  baseVersion: string
  revision: number
  version: string
  updatedAt: string
  notes: string
}

export const environmentVersions: Record<AppEnvironment, EnvironmentVersionInfo> = {
  dev: {
    baseVersion: '1.0.1',
    revision: 13,
    version: '1.0.1-dev.13',
    updatedAt: '2026-03-23',
    notes: 'Automatic version update for staged dashboard changes.',
  },
  uat: {
    baseVersion: '1.0.1',
    revision: 21,
    version: '1.0.1-uat.21',
    updatedAt: '2026-03-23',
    notes: 'Promotion from dev to uat',
  },
  prod: {
    baseVersion: '1.0.1',
    revision: 6,
    version: '1.0.1-prod.6',
    updatedAt: '2026-03-23',
    notes: 'Latest production promotion.',
  },
}
