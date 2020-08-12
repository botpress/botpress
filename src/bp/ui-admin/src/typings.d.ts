// TODO: remove when at least one typing is exported from this file
export interface test {}

declare global {
  interface Window {
    APP_NAME: string
    APP_VERSION: string
    APP_FAVICON: string
    APP_CUSTOM_CSS: string
    ROOT_PATH: string
    SEND_USAGE_STATS: boolean
    TELEMETRY_URL: string
  }
}
