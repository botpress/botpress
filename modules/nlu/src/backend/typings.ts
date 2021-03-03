import * as sdk from 'botpress/sdk'
import nluCore from 'nlu-core'

import ModelService from './model-service'

export interface NLUState {
  engine: nluCore.Engine
  nluByBot: _.Dictionary<BotState>
  broadcastLoadModel?: (botId: string, modelId: nluCore.ModelId) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  sendNLUStatusEvent: (botId: string, trainSession: sdk.NLU.TrainingSession) => Promise<void>
}

export interface BotState {
  botId: string
  defaultLanguage: string
  languages: string[]
  trainOrLoad: (lang: string, disableTraining: boolean) => Promise<void>

  // TODO: we keep this DS in memory because it contains an unserializable lock,
  // but this should be abstracted by the train session service.
  trainSessions: _.Dictionary<sdk.NLU.TrainingSession>

  cancelTraining: (lang: string) => Promise<void>
  needsTrainingWatcher: sdk.ListenHandle
  modelsByLang: _.Dictionary<nluCore.ModelId>

  modelService: ModelService
}

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: sdk.NLU.TrainingSession
}
