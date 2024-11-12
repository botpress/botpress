import { BaseIntegration } from '../../bot/types'
export * from '../../bot/types/generic'

export type BasePlugin = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
}
