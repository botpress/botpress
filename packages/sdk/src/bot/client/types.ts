import * as client from '@botpress/client'
import { Join, UnionToIntersection, Merge, ValueOf, Split, Cast } from '../../type-utils'
import { BaseBot } from '../generic'

/**
 * 0. Definitions
 */

export type EventDefinition = BaseBot['events'][string]
export type StateDefinition = BaseBot['states'][string]

export type IntegrationInstanceDefinition = BaseBot['integrations'][string]
export type IntegrationInstanceConfigurationDefinition = IntegrationInstanceDefinition['configuration']
export type IntegrationInstanceActionDefinition = IntegrationInstanceDefinition['actions'][string]
export type IntegrationInstanceChannelDefinition = IntegrationInstanceDefinition['channels'][string]
export type IntegrationInstanceMessageDefinition = IntegrationInstanceChannelDefinition['messages'][string]
export type IntegrationInstanceEventDefinition = IntegrationInstanceDefinition['events'][string]
export type IntegrationInstanceStateDefinition = IntegrationInstanceDefinition['states'][string]
export type IntegrationInstanceUserDefinition = IntegrationInstanceDefinition['user']

/**
 * 1. Enumerations
 */

// { "slack:addReaction": ActionDefinition }
export type EnumerateActions<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TActionName in keyof TBot['integrations'][TIntegrationName]['actions'] as Join<
        [TIntegrationName, ':', TActionName]
      >]: TBot['integrations'][TIntegrationName]['actions'][TActionName]
    }
  }[keyof TBot['integrations']]
>

// { "slack:reactionAdded": EventDefinition }
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

// { "slack:dm": ChannelDefinition }
export type EnumerateChannels<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TChannelName in keyof TBot['integrations'][TIntegrationName]['channels'] as Join<
        [TIntegrationName, ':', TChannelName]
      >]: TBot['integrations'][TIntegrationName]['channels'][TChannelName]
    }
  }[keyof TBot['integrations']]
>

// { "slack:dm:image": MessageDefinition }
export type EnumerateMessages<TBot extends BaseBot> = UnionToIntersection<
  {
    [TIntegrationName in keyof TBot['integrations']]: {
      [TChannelName in keyof TBot['integrations'][TIntegrationName]['channels']]: {
        [TMessageName in keyof TBot['integrations'][TIntegrationName]['channels'][TChannelName]['messages'] as Join<
          [TIntegrationName, ':', TChannelName, ':', TMessageName]
        >]: TBot['integrations'][TIntegrationName]['channels'][TChannelName]['messages'][TMessageName]
      }
    }[keyof TBot['integrations'][TIntegrationName]['channels']]
  }[keyof TBot['integrations']]
>

// { "image": SlackImageMessageDefinition | TelegramImageMessageDefinition }
export type GetMessages<TBot extends BaseBot> = {
  [K in keyof EnumerateMessages<TBot> as Cast<Split<K, ':'>[2], string>]: EnumerateMessages<TBot>[K]
}

/**
 * 2. Responses
 */

export type EventResponse<TBot extends BaseBot> = {
  event: {
    [K in keyof EnumerateEvents<TBot>]: Merge<client.Event, { type: K; payload: EnumerateEvents<TBot>[K] }>
  }[keyof EnumerateEvents<TBot>]
}

export type MessageResponse<
  TBot extends BaseBot,
  TMessage extends keyof GetMessages<TBot> = keyof GetMessages<TBot>
> = {
  // TODO: use bot definiton message property to infer allowed tags (cannot be done until there is a bot.definition.ts file)
  message: ValueOf<{
    [K in keyof GetMessages<TBot> as K extends TMessage ? K : never]: Merge<
      client.Message,
      { type: K; payload: GetMessages<TBot>[K] }
    >
  }>
}
