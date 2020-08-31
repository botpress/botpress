import { NLU } from 'botpress/sdk'

export interface NluMlRecommendations {
  minUtterancesForML: number
  goodUtterancesForML: number
}

export type NLUState = {
  nluByBot: _.Dictionary<BotState>
  logger: NLU.Logger
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  sendNLUStatusEvent: (botId: string, trainSession: NLU.TrainingSession) => Promise<void>
}

export interface BotState {
  botId: string
  engine: NLU.Engine
  trainOrLoad: (forceTrain: boolean) => Promise<void>
  trainSessions: _.Dictionary<NLU.TrainingSession>
  cancelTraining: () => Promise<void>
}

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}
