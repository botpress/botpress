import { BPStorage } from '../../../../../packages/ui-shared-lite/utils/storage'

declare global {
  interface Window {
    __BP_VISITOR_ID: string
    botpressWebChat: {
      init: (config: any, containerSelector?: string) => void
      sendEvent: (payload: any, webchatId?: string) => void
    }
    BP_STORAGE: BPStorage
  }
}
