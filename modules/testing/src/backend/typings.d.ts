import * as sdk from 'botpress/sdk'
import { Testing } from './testing'

export interface TestByBot {
  [botId: string]: Testing
}

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

export interface Status {
  status?: 'pass' | 'fail' | 'pending'
  mismatch?: ScenarioMismatch
  completedSteps?: number
}

export interface ScenarioStatus {
  [scenarioName: string]: Status
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
  // TODO: Figure out what typing the response can be in case of QnAs
  botResponse: string | { text: string }
  replySource: string
}

export interface Preview {
  id: string
  preview: string
}

export interface State {
  recording: boolean
  running: boolean
}
