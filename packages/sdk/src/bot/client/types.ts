import { Cast, Join, UnionToIntersection } from '../../type-utils'
import { Bot } from '../implementation'
import { IntegrationInstance, IntegrationInstanceDefinition } from '../integration-instance'

type Def<T> = NonNullable<T>

export type UserDefinition = Def<Bot['props']['user']>
export type ConversationDefinition = Def<Bot['props']['conversation']>
export type MessageDefinition = Def<Bot['props']['message']>
export type ConfigurationDefinition = Def<Bot['props']['configuration']>
export type StateDefinition = Def<Bot['props']['states']>[string]
export type EventDefinition = Def<Bot['props']['events']>[string]
export type RecurringEventDefinition = Def<Bot['props']['recurringEvents']>[string]

export type IntegrationConfigurationDefinition = Def<IntegrationInstanceDefinition['configuration']>
export type IntegrationEventDefinition = Def<IntegrationInstanceDefinition['events']>[string]
export type IntegrationActionDefinition = Def<IntegrationInstanceDefinition['actions']>[string]
export type IntegrationChannelDefinition = Def<IntegrationInstanceDefinition['channels']>[string]
export type IntegrationUserDefinition = Def<IntegrationInstanceDefinition['user']>

export type GetStateByName<TBot extends Bot, StateName extends keyof TBot['props']['states']> = Cast<
  TBot['props']['states'][StateName],
  StateDefinition
>

type _ListBotUserTags<TBot extends Bot> = keyof Def<TBot['props']['user']>['tags']
type _ListIntegrationUserTags<TBot extends Bot, IntegrationName extends IntegrationsOf<TBot>> = Join<
  [IntegrationName, ':', keyof Def<Def<GetIntegrationByName<TBot, IntegrationName>['user']>['tags']>]
>
export type ListUserTags<TBot extends Bot, IntegrationName extends IntegrationsOf<TBot> | null> =
  | _ListBotUserTags<TBot>
  | (IntegrationName extends IntegrationsOf<TBot> ? _ListIntegrationUserTags<TBot, IntegrationName> : never)

export type IntegrationsOf<TBot extends Bot> = TBot extends Bot<infer IntegrationNames> ? IntegrationNames : never

export type GetIntegrationByName<TBot extends Bot<any>, IntegrationName extends IntegrationsOf<TBot>> = Cast<
  TBot['props']['integrations'][IntegrationName],
  IntegrationInstance<IntegrationName>
>['definition']

export type EnumerateActions<TBot extends Bot> = UnionToIntersection<
  {
    [IntegrationName in IntegrationsOf<TBot>]: {
      [ActionName in keyof GetIntegrationByName<TBot, IntegrationName>['actions'] as Join<
        [IntegrationName, ':', ActionName]
      >]: GetIntegrationByName<TBot, IntegrationName>['actions'][ActionName]
    }
  }[IntegrationsOf<TBot>]
>
