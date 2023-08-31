import { Integration } from '@botpress/client'

export type File = { path: string; content: string }

export type IntegrationDefinition = Pick<
  Integration,
  'name' | 'version' | 'configuration' | 'channels' | 'states' | 'events' | 'actions' | 'user'
> & {
  id: string | null
}

type Def<T> = NonNullable<T>

export type ConfigurationDefinition = Def<IntegrationDefinition['configuration']>
export type ChannelDefinition = Def<IntegrationDefinition['channels']>[string]
export type MessageDefinition = Def<ChannelDefinition['messages']>[string]
export type ActionDefinition = Def<IntegrationDefinition['actions']>[string]
export type EventDefinition = Def<IntegrationDefinition['events']>[string]
export type StateDefinition = Def<IntegrationDefinition['states']>[string]
export type UserDefinition = Def<IntegrationDefinition['user']>
