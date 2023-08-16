import { BaseIntegration } from '../integration/generic'

export type BaseIntegrations = Record<string, BaseIntegration>
export type BaseBot = {
  integrations: BaseIntegrations
  events: Record<string, any>
  states: Record<string, any>
}
