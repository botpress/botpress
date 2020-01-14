import * as sdk from 'botpress/sdk'
import Storage from './storage'

export type BotStorage = { [key: string]: Storage }
export type TriggerGoal = sdk.FlowTrigger & { goal: string }

export interface NduLog {
  target: string

  text: string
  currentGoal: string | undefined
  currentGoalId: string | undefined
  nextGoal: string | undefined
  triggers: any
  result: string | undefined
}
