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
  contentAnswers: sdk.FormData[]
  redirectFlow: string
  redirectNode: string
  lastModified?: Date
}

export interface QnaItem {
  id: string
  key?: string
  isNew?: boolean
  saveError?: string
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
