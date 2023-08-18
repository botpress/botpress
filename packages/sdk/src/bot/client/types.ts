import { Cast, Join, UnionToIntersection } from '../../type-utils'
import { BaseBot } from '../generic'

export type EventDefinition = BaseBot['events'][string]
export type StateDefinition = BaseBot['states'][string]

export type IntegrationInstanceDefinition = BaseBot['integrations'][string]
export type IntegrationInstanceConfigurationDefinition = IntegrationInstanceDefinition['configuration']
export type IntegrationInstanceActionDefinition = IntegrationInstanceDefinition['actions'][string]
export type IntegrationInstanceChannelDefinition = IntegrationInstanceDefinition['channels'][string]
export type IntegrationInstanceEventDefinition = IntegrationInstanceDefinition['events'][string]
export type IntegrationInstanceStateDefinition = IntegrationInstanceDefinition['states'][string]
export type IntegrationInstanceUserDefinition = IntegrationInstanceDefinition['user']

export type EnumerateActions<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TActionName in keyof TBot['integrations'][TIntegrationName]['actions'] as Join<
        [TIntegrationName, ':', TActionName]
      >]: TBot['integrations'][TIntegrationName]['actions'][TActionName]
    }
  }[keyof TBot['integrations']]
>

export type GetIntegrationByName<TBot extends BaseBot, TIntegrationName extends keyof TBot['integrations']> = Cast<
  TBot['integrations'][TIntegrationName],
  IntegrationInstanceDefinition
>

export type GetIntegrationChannelByName<
  TBot extends BaseBot,
  TIntegrationName extends keyof TBot['integrations'],
  TChannelName extends keyof GetIntegrationByName<TBot, TIntegrationName>['channels']
> = Cast<GetIntegrationByName<TBot, TIntegrationName>['channels'][TChannelName], IntegrationInstanceChannelDefinition>

export type EnumerateEvents<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TEventName in keyof TBot['integrations'][TIntegrationName]['events'] as Join<
        [TIntegrationName, ':', TEventName]
      >]: TBot['integrations'][TIntegrationName]['events'][TEventName]
    }
  }[keyof TBot['integrations']]
> &
  (string extends keyof TBot['events']
    ? {}
    : {
        [TEventName in keyof TBot['events']]: TBot['events'][TEventName]
      })
