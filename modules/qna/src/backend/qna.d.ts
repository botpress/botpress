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
  isLegacy: boolean
}

export interface Dic<T> {
  [Key: string]: T
}

export interface Item {
  id: string
  questions: Dic<string[]>
  answers: Dic<string[]>
  // @deprecated
  contexts?: string[]
  contentAnswers: sdk.Content.All[]
  enabled: boolean
  lastModified: Date
}

export type ItemLegacy = Item & {
  action: string
  location?: string
}

export interface Metadata {
  answers: Dic<string[]>
  contentAnswers: sdk.Content.All[]
  enabled: boolean
  lastModifiedOn: Date
}

export type Intent = Omit<sdk.NLU.IntentDefinition, 'metadata'> & { metadata?: Metadata }
