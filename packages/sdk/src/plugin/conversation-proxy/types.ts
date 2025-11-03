import type { ClientInputs, Conversation } from '@botpress/client'
import type { commonTypes } from '../../common'
import type { AsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin } from '../common'
import type * as messageProxy from '../message-proxy/types'
import type * as userProxy from '../user-proxy/types'

export type ConversationFinder<TPlugin extends BasePlugin> = {
  forIntegration: <TIntegrationAlias extends keyof TPlugin['integrations']>(
    integrationAlias: TIntegrationAlias
  ) => {
    onChannel: <TChannelName extends keyof TPlugin['integrations'][TIntegrationAlias]['channels']>(
      channelName: TChannelName
    ) => {
      list: (
        props: typeUtils.Merge<
          Omit<ClientInputs['listConversations'], 'integrationName' | 'channel' | 'nextToken'>,
          { tags?: commonTypes.ToTags<keyof TPlugin['conversation']['tags']> }
        >
      ) => AsyncCollection<ActionableConversation<TPlugin>>
    }
  }
  forInterface: <TInterfaceAlias extends keyof TPlugin['interfaces']>(
    interfaceAlias: TInterfaceAlias
  ) => {
    onChannel: <TChannelName extends keyof TPlugin['interfaces'][TInterfaceAlias]['channels']>(
      channelName: TChannelName
    ) => {
      list: (
        props: typeUtils.Merge<
          Omit<ClientInputs['listConversations'], 'integrationName' | 'channel' | 'nextToken'>,
          { tags?: commonTypes.ToTags<keyof TPlugin['conversation']['tags']> }
        >
      ) => AsyncCollection<ActionableConversation<TPlugin>>
    }
  }
  getById: (props: { id: string }) => Promise<ActionableConversation<TPlugin> | undefined>
}

export type ActionableConversation<TPlugin extends BasePlugin> = Conversation & {
  delete: () => Promise<void>
  update: (
    props: typeUtils.Merge<
      Omit<ClientInputs['updateConversation'], 'id'>,
      { tags?: commonTypes.ToTags<keyof TPlugin['conversation']['tags']> }
    >
  ) => Promise<ActionableConversation<TPlugin>>
  getMessage: (props: { id: string }) => Promise<messageProxy.ActionableMessage<TPlugin> | undefined>
  getOrCreateMessage: (
    props: typeUtils.Merge<
      Omit<ClientInputs['getOrCreateMessage'], 'conversationId'>,
      { tags: commonTypes.ToTags<keyof TPlugin['message']['tags']> }
    >
  ) => Promise<messageProxy.ActionableMessage<TPlugin>>
  createMessage: (
    props: typeUtils.Merge<
      Omit<ClientInputs['createMessage'], 'conversationId'>,
      { tags: commonTypes.ToTags<keyof TPlugin['message']['tags']> }
    >
  ) => Promise<messageProxy.ActionableMessage<TPlugin>>
  listMessages: (
    props: typeUtils.Merge<
      Omit<ClientInputs['listMessages'], 'conversationId' | 'nextToken'>,
      { tags?: commonTypes.ToTags<keyof TPlugin['message']['tags']> }
    >
  ) => AsyncCollection<messageProxy.ActionableMessage<TPlugin>>
  listParticipants: () => AsyncCollection<userProxy.ActionableUser<TPlugin, string>>
}
