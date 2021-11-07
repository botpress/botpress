// TODO: remove when at least one typing is exported from this file
export interface test {}

interface NpsConfig {
  minConnections: number
  minSessionDuration: number
  isSet: boolean
}

interface NpsTracking {
  connections: number
  isCanceled: boolean
  isSet: boolean
  score: number | null
  date: string | null
}

export interface Nps {
  config: NpsConfig
  tracking: NpsTracking
}

declare global {
  interface Window {
    APP_NAME: string
    APP_VERSION: string
    APP_FAVICON: string
    APP_CUSTOM_CSS: string
    ROOT_PATH: string
    TELEMETRY_URL: string
    USE_JWT_COOKIES: boolean
    __REDUX_DEVTOOLS_EXTENSION__: any
    __BP_VISITOR_SOCKET_ID: string
    __BP_VISITOR_ID: string
    SOCKET_TRANSPORTS: any
    SERVER_ID: string
    BOT_ID: string
    botpress: {
      [moduleName: string]: any
    }
  }
}
