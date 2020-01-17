import * as sdk from 'botpress/sdk'
import Storage from './storage'

export type BotStorage = { [key: string]: Storage }
export type TriggerGoal = sdk.FlowTrigger & { goal: string }
