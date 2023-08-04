import { Integration } from '@botpress/client'

export { File } from '../typings'

type Def<T> = NonNullable<T>

export type ConfigurationDefinition = Integration['configuration']
export type ChannelDefinition = Def<Integration['channels']>[string]
export type MessageDefinition = Def<ChannelDefinition['messages']>[string]
export type ActionDefinition = Def<Integration['actions']>[string]
export type EventDefinition = Def<Integration['events']>[string]
