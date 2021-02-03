import { NLU } from 'botpress/sdk'

import { NLUApplication } from './application'

export interface NLUState {
  engine: NLU.Engine
  application: NLUApplication
}

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}
