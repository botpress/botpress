// TODO: remove when at least one typing is exported from this file
export interface test {}

declare global {
  interface Window {
    __BP_VISITOR_ID: string
    botpressWebChat: any
    BOT_API_PATH: string
    API_PATH: string
    BOTPRESS_VERSION: string
    BOT_NAME: string
    BOT_ID: string
    BP_BASE_PATH: string
    SEND_USAGE_STATS: boolean
    botpress: {
      [moduleName: string]: any
    }
    toggleSidePanel: () => void
  }
}
