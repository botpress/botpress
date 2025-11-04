import type { ClientInputs, Conversation } from '@botpress/client'
import type { commonTypes } from '../../common'
import type { AsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin } from '../common'
import type * as messageProxy from '../message-proxy/types'
import type * as userProxy from '../user-proxy/types'

export type ConversationFinder<
  TPlugin extends BasePlugin,
  TIntegrationAlias extends typeUtils.StringKeys<TPlugin['integrations']> | undefined = undefined,
  TInterfaceAlias extends typeUtils.StringKeys<TPlugin['interfaces']> | undefined = undefined,
> = {
  forIntegration: <TNewAlias extends typeUtils.StringKeys<TPlugin['integrations']>>(
    integrationAlias: TNewAlias
  ) => ConversationFinder<TPlugin, TNewAlias, undefined>
  forInterface: <TNewAlias extends typeUtils.StringKeys<TPlugin['interfaces']>>(
    interfaceAlias: TNewAlias
  ) => ConversationFinder<TPlugin, undefined, TNewAlias>
  list: (
    props?: typeUtils.Merge<
      Omit<ClientInputs['listConversations'], 'integrationName' | 'channel' | 'nextToken'>,
      { tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>> }
    >
  ) => AsyncCollection<ActionableConversation<TPlugin>>
  getById: (props: { id: string }) => Promise<ActionableConversation<TPlugin> | undefined>
} & (TIntegrationAlias extends typeUtils.StringKeys<TPlugin['integrations']>
  ? {
      onChannel: <TChannelName extends typeUtils.StringKeys<TPlugin['integrations'][TIntegrationAlias]['channels']>>(
        channelName: TChannelName
      ) => ConversationFinder<TPlugin, TIntegrationAlias, undefined>
    }
  : {}) &
  (TInterfaceAlias extends typeUtils.StringKeys<TPlugin['interfaces']>
    ? {
        onChannel: <TChannelName extends typeUtils.StringKeys<TPlugin['interfaces'][TInterfaceAlias]['channels']>>(
          channelName: TChannelName
        ) => ConversationFinder<TPlugin, TInterfaceAlias, undefined>
      }
    : {})

export type ActionableConversation<TPlugin extends BasePlugin> = typeUtils.Merge<
  Conversation,
  { tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>> }
> & {
  delete: () => Promise<void>
  update: (
    props: typeUtils.Merge<
      Omit<ClientInputs['updateConversation'], 'id'>,
      { tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['conversation']['tags']>> }
    >
  ) => Promise<ActionableConversation<TPlugin>>
  getMessage: (props: { id: string }) => Promise<messageProxy.ActionableMessage<TPlugin> | undefined>
  getOrCreateMessage: (
    props: typeUtils.Merge<
      Omit<ClientInputs['getOrCreateMessage'], 'conversationId'>,
      { tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }
    >
  ) => Promise<messageProxy.ActionableMessage<TPlugin>>
  createMessage: (
    props: typeUtils.Merge<
      Omit<ClientInputs['createMessage'], 'conversationId'>,
      { tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }
    >
  ) => Promise<messageProxy.ActionableMessage<TPlugin>>
  listMessages: (
    props?: typeUtils.Merge<
      Omit<ClientInputs['listMessages'], 'conversationId' | 'nextToken'>,
      { tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }
    >
  ) => AsyncCollection<messageProxy.ActionableMessage<TPlugin>>
  listParticipants: () => AsyncCollection<userProxy.ActionableUser<TPlugin, string>>
}
