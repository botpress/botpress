import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'

import type { commonTypes } from '../../common'
import { type AsyncCollection, createAsyncCollection } from '../../utils/api-paging-utils'
import { notFoundErrorToUndefined } from '../../utils/error-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin, PluginRuntimeProps } from '../common'
import { proxyMessage } from '../message-proxy/proxy'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../tag-prefixer'
import { proxyUser } from '../user-proxy'
import type { ActionableConversation, ConversationFinder } from './types'

export const proxyConversations = <
  TPlugin extends BasePlugin,
  TIntegrationAlias extends typeUtils.StringKeys<TPlugin['integrations']> | undefined = undefined,
  TInterfaceAlias extends typeUtils.StringKeys<TPlugin['interfaces']> | undefined = undefined,
>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
  integrationAlias?: TIntegrationAlias
  interfaceAlias?: TInterfaceAlias
  channelName?: string
}): ConversationFinder<TPlugin, TIntegrationAlias, TInterfaceAlias> =>
  ({
    forIntegration: (alias: string): any =>
      proxyConversations<TPlugin, typeUtils.StringKeys<TPlugin['integrations']>, undefined>({
        ...props,
        integrationAlias: alias as typeUtils.StringKeys<TPlugin['integrations']>,
        interfaceAlias: undefined,
        channelName: undefined,
      }) satisfies ConversationFinder<TPlugin, typeUtils.StringKeys<TPlugin['integrations']>, undefined>,

    forInterface: (alias: string): any => {
      // FIXME: we should retrieve the integration alias, not the name:
      const integrationName = props.plugin?.interfaces[alias as typeUtils.StringKeys<TPlugin['interfaces']>].name as
        | typeUtils.StringKeys<TPlugin['integrations']>
        | undefined

      return proxyConversations({
        ...props,
        integrationAlias: integrationName,
        interfaceAlias: alias as typeUtils.StringKeys<TPlugin['interfaces']>,
        channelName: undefined,
      }) satisfies ConversationFinder<
        TPlugin,
        typeUtils.StringKeys<TPlugin['integrations']>,
        typeUtils.StringKeys<TPlugin['interfaces']>
      >
    },

    onChannel: (channelName: string): any =>
      proxyConversations<TPlugin, TIntegrationAlias, TInterfaceAlias>({
        ...props,
        channelName,
      }) satisfies ConversationFinder<TPlugin, TIntegrationAlias, TInterfaceAlias>,

    list(listProps): any {
      return createAsyncCollection(({ nextToken }) =>
        props.client
          .listConversations({
            ...prefixTagsIfNeeded(listProps ?? {}, { alias: props.plugin?.alias }),
            channel: props.channelName,
            integrationName: props.integrationAlias,
            nextToken,
          })
          .then(({ meta, conversations }) => ({
            meta,
            items: conversations.map((conversation) => proxyConversation({ ...props, conversation })),
          }))
      ) satisfies AsyncCollection<ActionableConversation<TPlugin>>
    },

    async getById({ id }): Promise<any> {
      const response = await notFoundErrorToUndefined(props.client.getConversation({ id }))
      return response
        ? (proxyConversation({
            ...props,
            conversation: response.conversation,
          }) satisfies ActionableConversation<TPlugin>)
        : undefined
    },
  }) satisfies ConversationFinder<any, any, any> as unknown as ConversationFinder<
    TPlugin,
    TIntegrationAlias,
    TInterfaceAlias
  >

export const proxyConversation = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
  conversation: client.Conversation
}): ActionableConversation<TPlugin> => {
  // Client.GetMessageResponse conflicts with MessageResponse<TPlugin>:
  const vanillaClient = props.client as client.Client

  return {
    ...(unprefixTagsOwnedByPlugin(props.conversation, { alias: props.plugin?.alias }) as typeUtils.Merge<
      client.Conversation,
      { tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['message']['tags']>> }
    >),

    async delete() {
      await vanillaClient.deleteConversation({ id: props.conversation.id })
    },

    async update(data) {
      const { conversation: updatedConversation } = await vanillaClient.updateConversation({
        ...prefixTagsIfNeeded(data, { alias: props.plugin?.alias }),
        id: props.conversation.id,
      })

      return proxyConversation({ ...props, conversation: updatedConversation })
    },

    async getMessage({ id }) {
      const response = await notFoundErrorToUndefined(vanillaClient.getMessage({ id }))
      return response ? proxyMessage({ ...props, message: response.message }) : undefined
    },

    async getOrCreateMessage(data) {
      const { message } = await vanillaClient.getOrCreateMessage({
        ...prefixTagsIfNeeded(data, { alias: props.plugin?.alias }),
        conversationId: props.conversation.id,
      })

      return proxyMessage({ ...props, message })
    },

    async createMessage(data) {
      const { message } = await vanillaClient.createMessage({
        ...prefixTagsIfNeeded(data, { alias: props.plugin?.alias }),
        conversationId: props.conversation.id,
      })

      return proxyMessage({ ...props, message })
    },

    listMessages(listProps) {
      return createAsyncCollection(({ nextToken }) =>
        vanillaClient
          .listMessages({
            ...prefixTagsIfNeeded(listProps ?? {}, { alias: props.plugin?.alias }),
            conversationId: props.conversation.id,
            nextToken,
          })
          .then(({ meta, messages }) => ({
            meta,
            items: messages.map((message) => proxyMessage({ ...props, message })),
          }))
      )
    },

    listParticipants() {
      return createAsyncCollection(({ nextToken }) =>
        vanillaClient
          .listParticipants({
            id: props.conversation.id,
            nextToken,
          })
          .then(({ meta, participants }) => ({
            meta,
            items: participants.map((user) =>
              proxyUser<TPlugin, string>({ ...props, user, conversationId: props.conversation.id })
            ),
          }))
      )
    },
  }
}
