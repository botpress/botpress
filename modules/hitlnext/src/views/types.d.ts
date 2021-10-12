import { BPStorage } from '../../../../packages/ui-shared-lite/utils/storage'

declare global {
  interface Window {
    botpressWebChat: {
      init: (config: any, containerSelector?: string) => void
      sendEvent: (payload: any, webchatId?: string) => void
    }
    BOT_ID: string
    BP_STORAGE: BPStorage
    ROOT_PATH: string
  }
}
