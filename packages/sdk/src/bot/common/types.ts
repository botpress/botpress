import { Join, UnionToIntersection, Split, Cast } from '../../utils/type-utils'
import { BaseBot } from './generic'

export type IntegrationInstanceDefinition = BaseBot['integrations'][string]
export type IntegrationInstanceConfigurationDefinition = IntegrationInstanceDefinition['configuration']
export type IntegrationInstanceActionDefinition = IntegrationInstanceDefinition['actions'][string]
export type IntegrationInstanceChannelDefinition = IntegrationInstanceDefinition['channels'][string]
export type IntegrationInstanceMessageDefinition = IntegrationInstanceChannelDefinition['messages'][string]
export type IntegrationInstanceEventDefinition = IntegrationInstanceDefinition['events'][string]
export type IntegrationInstanceStateDefinition = IntegrationInstanceDefinition['states'][string]
export type IntegrationInstanceUserDefinition = IntegrationInstanceDefinition['user']

type ActionKey<TIntegrationName extends string, TActionName extends string> = string extends TIntegrationName
  ? string
  : string extends TActionName
    ? string
    : Join<[TIntegrationName, ':', TActionName]>

export type EnumerateActions<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TActionName in keyof TBot['integrations'][TIntegrationName]['actions'] as ActionKey<
        Cast<TIntegrationName, string>,
        Cast<TActionName, string>
      >]: TBot['integrations'][TIntegrationName]['actions'][TActionName]
    }
  }[keyof TBot['integrations']]
> & {}

export type EnumerateActionInputs<TBot extends BaseBot> = {
  [K in keyof EnumerateActions<TBot>]: Cast<EnumerateActions<TBot>[K], IntegrationInstanceActionDefinition>['input']
}

export type EnumerateActionOutputs<TBot extends BaseBot> = {
  [K in keyof EnumerateActions<TBot>]: Cast<EnumerateActions<TBot>[K], IntegrationInstanceActionDefinition>['output']
}

type EventKey<TIntegrationName extends string, TEventName extends string> = string extends TIntegrationName
  ? string
  : string extends TEventName
    ? string
    : Join<[TIntegrationName, ':', TEventName]>

export type EnumerateEvents<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TEventName in keyof TBot['integrations'][TIntegrationName]['events'] as EventKey<
        Cast<TIntegrationName, string>,
        Cast<TEventName, string>
      >]: TBot['integrations'][TIntegrationName]['events'][TEventName]
    }
  }[keyof TBot['integrations']]
> & {
  [TEventName in keyof TBot['events']]: TBot['events'][TEventName]
}

type ChannelKey<TIntegrationName extends string, TChannelName extends string> = string extends TIntegrationName
  ? string
  : string extends TChannelName
    ? string
    : Join<[TIntegrationName, ':', TChannelName]>

export type EnumerateChannels<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TChannelName in keyof TBot['integrations'][TIntegrationName]['channels'] as ChannelKey<
        Cast<TIntegrationName, string>,
        Cast<TChannelName, string>
      >]: TBot['integrations'][TIntegrationName]['channels'][TChannelName]
    }
  }[keyof TBot['integrations']]
> & {}

type MessageKey<
  TIntegrationName extends string,
  TChannelName extends string,
  TMessageName extends string,
> = string extends TIntegrationName
  ? string
  : string extends TChannelName
    ? string
    : string extends TMessageName
      ? string
      : Join<[TIntegrationName, ':', TChannelName, ':', TMessageName]>

export type EnumerateMessages<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TChannelName in keyof TBot['integrations'][TIntegrationName]['channels']]: {
        [TMessageName in keyof TBot['integrations'][TIntegrationName]['channels'][TChannelName]['messages'] as MessageKey<
          Cast<TIntegrationName, string>,
          Cast<TChannelName, string>,
          Cast<TMessageName, string>
        >]: TBot['integrations'][TIntegrationName]['channels'][TChannelName]['messages'][TMessageName]
      }
    }[keyof TBot['integrations'][TIntegrationName]['channels']]
  }[keyof TBot['integrations']]
> & {}

export type GetMessages<TBot extends BaseBot> = {
  [K in keyof EnumerateMessages<TBot> as Cast<Split<K, ':'>[2], string>]: EnumerateMessages<TBot>[K]
}

export type EnumerateStates<TBot extends BaseBot> = {
  [K in keyof TBot['states']]: TBot['states'][K]
}

export type EnumerateTables<TBot extends BaseBot> = {
  [K in keyof TBot['tables']]: TBot['tables'][K]
}
