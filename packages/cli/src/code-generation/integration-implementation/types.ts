import { IntegrationDefinition } from '@botpress/sdk'

export { File } from '../typings'

type Def<T> = NonNullable<T>

export type ConfigurationDefinition = Def<IntegrationDefinition['configuration']>
export type ChannelDefinition = Def<IntegrationDefinition['channels']>[string]
export type MessageDefinition = Def<ChannelDefinition['messages']>[string]
export type ActionDefinition = Def<IntegrationDefinition['actions']>[string]
export type EventDefinition = Def<IntegrationDefinition['events']>[string]
export type StateDefinition = Def<IntegrationDefinition['states']>[string]
