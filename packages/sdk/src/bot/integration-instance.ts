import { IntegrationDefinitionProps } from '../integration/definition'

export type IntegrationInstanceDefinition = Pick<
  IntegrationDefinitionProps,
  'configuration' | 'events' | 'actions' | 'channels' | 'user' // no need for states in the bot's perspective
>

export type IntegrationInstance<Name extends string> = {
  id: string
  enabled?: boolean
  configuration?: Record<string, any>

  name: Name
  version: string

  definition: IntegrationInstanceDefinition
}
