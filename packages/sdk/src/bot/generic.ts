import { BaseIntegration } from '../integration/generic'
import { AnyZodObject } from '../type-utils'

export type BaseIntegrations = Record<string, BaseIntegration>
export type BaseStates = Record<string, AnyZodObject>
export type BaseEvents = Record<string, AnyZodObject>

export type BaseBot = {
  integrations: BaseIntegrations
  events: BaseEvents
  states: BaseStates
}
