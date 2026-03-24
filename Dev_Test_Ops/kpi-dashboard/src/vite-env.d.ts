/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly VITE_ENVIRONMENT?: 'dev' | 'uat' | 'prod'
  readonly VITE_DATA_SOURCE?: string
  readonly VITE_REFRESH_INTERVAL_MINUTES?: string
  readonly VITE_RELEASE_CHANNEL?: string
  readonly VITE_DEV_REALTIME_ENABLED?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
