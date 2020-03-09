import { BPStorage } from '~/util/storage'

// TODO: remove when at least one typing is exported from this file
export interface test {}

declare global {
  interface Window {
    __BP_VISITOR_ID: string
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any
    botpressWebChat: any
    APP_NAME: string
    BOT_API_PATH: string
    API_PATH: string
    BOTPRESS_VERSION: string
    ROOT_PATH: string
    BOT_NAME: string
    BOT_ID: string
    BP_BASE_PATH: string
    SEND_USAGE_STATS: boolean
    IS_BOT_MOUNTED: boolean
    BOT_LOCKED: boolean
    WORKSPACE_ID: string
    BOTPRESS_FLOW_EDITOR_DISABLED: boolean
    SOCKET_TRANSPORTS: string[]
    ANALYTICS_ID: string
    UUID: string
    BP_STORAGE: BPStorage
    EXPERIMENTAL: boolean
    USE_SESSION_STORAGE: boolean
    botpress: {
      [moduleName: string]: any
    }
    toggleSidePanel: () => void
  }
}
