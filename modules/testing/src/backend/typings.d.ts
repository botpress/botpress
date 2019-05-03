import * as sdk from 'botpress/sdk'
import { Testing } from './testing'

export type TestByBot = { [botId: string]: Testing }

export interface Scenario {
  name?: string
  initialState?: sdk.IO.EventState
  finalState?: sdk.IO.EventState
  steps?: DialogStep[]
}

export type RunningScenario = {
  eventDestination: sdk.IO.EventDestination
  lastEventTs?: number
  completedSteps?: DialogStep[]
} & Scenario

export interface ScenarioStatus {
  [scenarioName: string]: {
    status?: 'pass' | 'fail' | 'pending'
    mismatch?: ScenarioMismatch
  }
}

export interface ScenarioMismatch {
  reason?: string
  expected?: DialogStep
  received?: DialogStep
  index?: number
}

export interface DialogStep {
  userMessage: string
  botReplies: BotReply[]
}

export interface BotReply {
  botResponse: string
  replySource: string
}
