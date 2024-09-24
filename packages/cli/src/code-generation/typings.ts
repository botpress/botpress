import * as client from '@botpress/client'

export type File = { path: string; content: string }

export type IntegrationDefinition = Pick<
  client.Integration,
  'name' | 'version' | 'channels' | 'states' | 'events' | 'actions' | 'user' | 'entities'
> & {
  id: string | null
  configuration: Pick<client.Integration['configuration'], 'schema'>
  configurations: Record<string, Pick<client.Integration['configuration'], 'schema'>>
}

type Def<T> = NonNullable<T>

export type ConfigurationDefinition = Def<IntegrationDefinition['configuration']>
export type ConfigurationsDefinition = Def<IntegrationDefinition['configurations']>
export type ChannelDefinition = Def<IntegrationDefinition['channels']>[string]
export type MessageDefinition = Def<ChannelDefinition['messages']>[string]
export type ActionDefinition = Def<IntegrationDefinition['actions']>[string]
export type EventDefinition = Def<IntegrationDefinition['events']>[string]
export type StateDefinition = Def<IntegrationDefinition['states']>[string]
export type UserDefinition = Def<IntegrationDefinition['user']>
export type EntityDefinition = Def<IntegrationDefinition['entities']>[string]
