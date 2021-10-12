import { BPStorage } from './storage'

declare global {
  interface Window {
    BP_STORAGE: BPStorage
    USE_SESSION_STORAGE: boolean
  }
}
