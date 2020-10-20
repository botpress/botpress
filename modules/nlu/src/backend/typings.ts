import { ListenHandle, NLU } from 'botpress/sdk'

export type NLUState = {
  nluByBot: _.Dictionary<BotState>
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  sendNLUStatusEvent: (botId: string, trainSession: NLU.TrainingSession) => Promise<void>
}

export interface BotState {
  botId: string
  engine: NLU.Engine
  defaultLanguage: string
  trainOrLoad: (forceTrain: boolean) => Promise<void>
  trainSessions: _.Dictionary<NLU.TrainingSession>
  cancelTraining: () => Promise<void>
  nluService: NLUService
  legacyIntentService: LegacyIntentService
  needsTrainingWatcher: ListenHandle
}

export interface NLUService {
  getIntentsAndEntities(): Promise<{
    intentDefs: NLU.IntentDefinition[]
    entityDefs: NLU.EntityDefinition[]
  }>
  getEntities(): Promise<NLU.EntityDefinition[]>
}

export interface LegacyIntentService {
  getIntents(): Promise<LegacyIntentDefinition[]>
  getContexts(): Promise<string[]>
  createIntent(intent: NewLegacyIntentDefinition): Promise<void>
  updateIntent(name: string, intent: LegacyIntentDefinition): Promise<void>
  deleteIntent(intent: string): Promise<void>
}

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}

export type LegacyIntentDefinition = Omit<NLU.IntentDefinition, 'slots'> & {
  slots: LegacySlotDefinition[]
}

export type NewLegacyIntentDefinition = Omit<LegacyIntentDefinition, 'filename'>

export type LegacySlotDefinition = {
  id: string
  name: string
  entities: string[]
  color: number
}
