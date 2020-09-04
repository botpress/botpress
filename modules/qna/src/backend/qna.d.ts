import * as sdk from 'botpress/sdk'

import { Config } from 'src/config'
import Storage from './storage'

export interface ScopedBots {
  [botId: string]: BotParams
}

export interface BotParams {
  config: Config
  storage: Storage
  defaultLang: string
}

export interface Dic<T> {
  [Key: string]: T
}

export interface Item {
  id: string
  questions: Dic<string[]>
  answers: Dic<string[]>
  contentAnswers: sdk.Content.All[]
  enabled: boolean
  lastModified: Date
}
