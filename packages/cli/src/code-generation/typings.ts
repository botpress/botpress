import * as sdk from '@botpress/sdk'

type Def<T> = NonNullable<T>
export type File = { path: string; content: string }

export type IntegrationDefinition = sdk.IntegrationDefinition
export type BotDefinition = sdk.BotDefinition

export namespace integration {
  export type ConfigurationDefinition = Def<sdk.IntegrationDefinition['configuration']>
  export type ConfigurationsDefinition = Def<sdk.IntegrationDefinition['configurations']>
  export type ChannelDefinition = Def<sdk.IntegrationDefinition['channels']>[string]
  export type MessageDefinition = Def<ChannelDefinition['messages']>[string]
  export type ActionDefinition = Def<sdk.IntegrationDefinition['actions']>[string]
  export type EventDefinition = Def<sdk.IntegrationDefinition['events']>[string]
  export type StateDefinition = Def<sdk.IntegrationDefinition['states']>[string]
  export type UserDefinition = Def<sdk.IntegrationDefinition['user']>
  export type EntityDefinition = Def<sdk.IntegrationDefinition['entities']>[string]
}

export namespace bot {
  export type EventDefinition = Def<sdk.BotDefinition['events']>[string]
  export type StateDefinition = Def<sdk.BotDefinition['states']>[string]
}
