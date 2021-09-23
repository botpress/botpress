import { BPStorage } from '../../ui-shared-lite/utils/storage'

// TODO: remove when at least one typing is exported from this file
export interface test {}

declare global {
  interface Window {
    __BP_VISITOR_ID: string
    __BP_VISITOR_SOCKET_ID: string

    BOT_API_PATH: string
    API_PATH: string
    USE_JWT_COOKIES: boolean
    ROOT_PATH: string
    BOT_NAME: string
    BOT_ID: string
    BP_BASE_PATH: string
    SEND_USAGE_STATS: boolean
    IS_BOT_MOUNTED: boolean
    BOT_LOCKED: boolean
    WORKSPACE_ID: string
    SOCKET_TRANSPORTS: string[]
    ANALYTICS_ID: string
    UUID: string
    BP_STORAGE: BPStorage
    EXPERIMENTAL: boolean
    USE_SESSION_STORAGE: boolean
    USE_ONEFLOW: boolean
    botpress: {
      [moduleName: string]: any
    }
    TELEMETRY_URL: string
    toggleSidePanel: () => void
  }
}
