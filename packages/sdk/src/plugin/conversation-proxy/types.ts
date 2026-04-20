import type * as client from '@botpress/client'
import type { commonTypes } from '../../common'
import type { AsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin } from '../common'
import type * as messageProxy from '../message-proxy/types'
import type * as userProxy from '../user-proxy/types'

export type ConversationFinder<TPlugin extends BasePlugin> = _ConversationFinderForDepType<TPlugin, 'interfaces'> &
  _ConversationFinderForDepType<TPlugin, 'integrations'>

type _ConversationFinderForDepType<TPlugin extends BasePlugin, TDepType extends 'interfaces' | 'integrations'> = {
  [TAlias in typeUtils.StringKeys<TPlugin[TDepType]> | '*']: {
    [TChannelName in TAlias extends '*'
      ? '*'
      : typeUtils.StringKeys<TPlugin[TDepType][TAlias]['channels']> | '*']: _ConversationFinderForChannel<
      TPlugin,
      TChannelName,
      _MessageForChannel<
        TPlugin,
        TDepType,
        TAlias extends '*' ? string : TAlias,
        TChannelName extends '*' ? string : TChannelName
      >
    >
  }
}

type _ConversationFinderForChannel<
  TPlugin extends BasePlugin,
  TChannelName extends string,
  TMessage extends client.Message,
> = {
  list: (
    props?: typeUtils.Merge<
      Omit<client.ClientInputs['listConversations'], 'integrationName' | 'channel' | 'nextToken'>,
      { tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>> }
    >
  ) => AsyncCollection<ActionableConversation<TPlugin, TChannelName extends '*' ? string : TChannelName, TMessage>>
  getById: (props: {
    id: string
  }) => Promise<ActionableConversation<TPlugin, TChannelName extends '*' ? string : TChannelName, TMessage>>
}

type _MessageForChannel<
  TPlugin extends BasePlugin,
  TDepType extends 'interfaces' | 'integrations',
  TAlias extends keyof TPlugin[TDepType],
  TChannelName extends keyof TPlugin[TDepType][TAlias]['channels'],
> = _FallbackWhenNever<
  Omit<client.Message, 'type' | 'payload' | 'tags'> &
    typeUtils.ValueOf<{
      [TMessageName in typeUtils.StringKeys<TPlugin[TDepType][TAlias]['channels'][TChannelName]['messages']>]: {
        type: TMessageName
        payload: TPlugin[TDepType][TAlias]['channels'][TChannelName]['messages'][TMessageName]
        tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>>
      }
    }>,
  typeUtils.Merge<client.Message, { tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }>
>

type _FallbackWhenNever<T, TFallback> = [T] extends [never] ? TFallback : T

export type ActionableConversation<
  TPlugin extends BasePlugin,
  TChannelName extends string = string,
  TMessage extends client.Message = client.Message,
> = typeUtils.Merge<
  client.Conversation,
  {
    tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>>
    channel: TChannelName
  }
> & {
  delete: () => Promise<void>
  update: (
    props: typeUtils.Merge<
      Omit<client.ClientInputs['updateConversation'], 'id'>,
      { tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>> }
    >
  ) => Promise<ActionableConversation<TPlugin>>
  getMessage: (props: { id: string }) => Promise<messageProxy.ActionableMessage<TPlugin, TMessage>>
  getOrCreateMessage: (
    props: Omit<client.ClientInputs['getOrCreateMessage'], 'conversationId' | 'tags' | 'type' | 'payload'> &
      typeUtils.DistributivePick<TMessage, 'type' | 'payload'> & {
        tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>>
      }
  ) => Promise<messageProxy.ActionableMessage<TPlugin, TMessage>>
  createMessage: (
    props: Omit<client.ClientInputs['createMessage'], 'conversationId' | 'tags' | 'type' | 'payload'> &
      typeUtils.DistributivePick<TMessage, 'type' | 'payload'> & {
        tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>>
      }
  ) => Promise<messageProxy.ActionableMessage<TPlugin, TMessage>>
  listMessages: (
    props?: typeUtils.Merge<
      Omit<client.ClientInputs['listMessages'], 'conversationId' | 'nextToken'>,
      { tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }
    >
  ) => AsyncCollection<messageProxy.ActionableMessage<TPlugin, TMessage>>
  listParticipants: () => AsyncCollection<userProxy.ActionableUser<TPlugin, string>>
}
