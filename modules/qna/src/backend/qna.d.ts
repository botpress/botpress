import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'
import Storage from './storage'

export type Action = 'text' | 'redirect' | 'text_redirect'

export interface QnaEntry {
  action: Action
  contexts: string[]
  enabled: boolean
  questions: {
    [lang: string]: string[]
  }
  answers: {
    [lang: string]: string[]
  }
  redirectFlow: string
  redirectNode: string
}

export interface QnaItem {
  id: string
  data: QnaEntry
}

export interface ScopedBots {
  [botId: string]: BotParams
}

export interface BotParams {
  config: Config
  storage: Storage
  defaultLang: string
}
