import { ListenHandle, NLU } from 'botpress/sdk'

export interface NLUState {
  engine: NLU.Engine
  nluByBot: _.Dictionary<BotState>
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  sendNLUStatusEvent: (botId: string, trainSession: NLU.TrainingSession) => Promise<void>
}

export interface BotState {
  botId: string
  defaultLanguage: string
  trainOrLoad: (disableTraining: boolean) => Promise<void>

  // TODO: we keep this DS in memory because it contains an unserializable lock,
  // but this should be abstracted by the train session service.
  trainSessions: _.Dictionary<NLU.TrainingSession>

  cancelTraining: () => Promise<void>
  needsTrainingWatcher: ListenHandle
  modelsByLang: _.Dictionary<string>
}

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}
