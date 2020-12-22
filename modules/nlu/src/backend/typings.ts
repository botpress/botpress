import { ListenHandle, NLU } from 'botpress/sdk'

import ModelService from './model-service'

export interface NLUState {
  engine: NLU.Engine
  nluByBot: _.Dictionary<BotState>
  broadcastLoadModel?: (botId: string, modelId: NLU.ModelId) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  sendNLUStatusEvent: (botId: string, trainSession: NLU.TrainingSession) => Promise<void>
}

export interface BotState {
  botId: string
  defaultLanguage: string
  languages: string[]
  trainOrLoad: (lang: string, disableTraining: boolean) => Promise<void>

  // TODO: we keep this DS in memory because it contains an unserializable lock,
  // but this should be abstracted by the train session service.
  trainSessions: _.Dictionary<NLU.TrainingSession>

  cancelTraining: (lang: string) => Promise<void>
  needsTrainingWatcher: ListenHandle
  modelsByLang: _.Dictionary<NLU.ModelId>

  modelService: ModelService
}

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}
