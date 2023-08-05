import { Cast, Join, UnionToIntersection } from '../../type-utils'
import { BotProps } from '../implementation'
import { IntegrationInstance, IntegrationInstanceDefinition } from '../integration-instance'

type Def<T> = NonNullable<T>

export type UserDefinition = Def<BotProps['user']>
export type ConversationDefinition = Def<BotProps['conversation']>
export type MessageDefinition = Def<BotProps['message']>
export type ConfigurationDefinition = Def<BotProps['configuration']>
export type StateDefinition = Def<BotProps['states']>[string]
export type EventDefinition = Def<BotProps['events']>[string]
export type RecurringEventDefinition = Def<BotProps['recurringEvents']>[string]

export type IntegrationConfigurationDefinition = Def<IntegrationInstanceDefinition['configuration']>
export type IntegrationEventDefinition = Def<IntegrationInstanceDefinition['events']>[string]
export type IntegrationActionDefinition = Def<IntegrationInstanceDefinition['actions']>[string]
export type IntegrationChannelDefinition = Def<IntegrationInstanceDefinition['channels']>[string]
export type IntegrationUserDefinition = Def<IntegrationInstanceDefinition['user']>

export type GetStateByName<TBot extends BotProps, StateName extends keyof TBot['states']> = Cast<
  TBot['states'][StateName],
  StateDefinition
>

type _ListBotUserTags<TBot extends BotProps> = keyof Def<TBot['user']>['tags']
type _ListIntegrationUserTags<TBot extends BotProps, IntegrationName extends IntegrationsOf<TBot>> = Join<
  [IntegrationName, ':', keyof Def<Def<GetIntegrationByName<TBot, IntegrationName>['user']>['tags']>]
>
export type ListUserTags<TBot extends BotProps, IntegrationName extends IntegrationsOf<TBot> | null> =
  | _ListBotUserTags<TBot>
  | (IntegrationName extends IntegrationsOf<TBot> ? _ListIntegrationUserTags<TBot, IntegrationName> : never)

export type IntegrationsOf<TBot extends BotProps> = TBot extends BotProps<infer IntegrationNames>
  ? IntegrationNames
  : never

export type GetIntegrationByName<TBot extends BotProps<any>, IntegrationName extends IntegrationsOf<TBot>> = Cast<
  TBot['integrations'][IntegrationName],
  IntegrationInstance<IntegrationName>
>['definition']

export type EnumerateActions<TBot extends BotProps> = UnionToIntersection<
  {
    [IntegrationName in IntegrationsOf<TBot>]: {
      [ActionName in keyof GetIntegrationByName<TBot, IntegrationName>['actions'] as Join<
        [IntegrationName, ':', ActionName]
      >]: GetIntegrationByName<TBot, IntegrationName>['actions'][ActionName]
    }
  }[IntegrationsOf<TBot>]
>
