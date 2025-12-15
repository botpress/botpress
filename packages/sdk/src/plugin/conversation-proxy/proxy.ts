import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'

import type { commonTypes } from '../../common'
import { type AsyncCollection, createAsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin, PluginRuntimeProps } from '../common'
import { proxyMessage } from '../message-proxy/proxy'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../tag-prefixer'
import { proxyUser } from '../user-proxy'
import type { ActionableConversation, ConversationFinder } from './types'

export const proxyConversations = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
}): ConversationFinder<TPlugin> =>
  new Proxy(
    {},
    {
      get: (_target, interfaceOrIntegrationAlias: string) =>
        new Proxy(
          {},
          {
            get: (_target2, channel: string) => {
              return {
                list(listProps): any {
                  const integrationName =
                    props.plugin?.interfaces[interfaceOrIntegrationAlias]?.integrationAlias ??
                    props.plugin?.integrations[interfaceOrIntegrationAlias]?.integrationAlias

                  const actualChannelName =
                    props.plugin?.interfaces[interfaceOrIntegrationAlias]?.channels?.[channel]?.name ?? channel

                  return createAsyncCollection(({ nextToken }) =>
                    props.client
                      .listConversations({
                        ...prefixTagsIfNeeded(listProps ?? {}, { alias: props.plugin?.alias }),
                        channel: actualChannelName === '*' ? undefined : actualChannelName,
                        integrationName: integrationName === '*' ? undefined : integrationName,
                        nextToken,
                      })
                      .then(({ meta, conversations }) => ({
                        meta,
                        items: conversations.map((conversation) => proxyConversation({ ...props, conversation })),
                      }))
                  ) satisfies AsyncCollection<ActionableConversation<TPlugin>>
                },

                async getById({ id }): Promise<any> {
                  const response = await props.client.getConversation({ id })
                  return proxyConversation({
                    ...props,
                    conversation: response.conversation,
                  }) satisfies ActionableConversation<TPlugin>
                },
              } satisfies ConversationFinder<TPlugin>['*']['*']
            },
          }
        ),
    }
  ) as ConversationFinder<TPlugin>

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
      const response = await vanillaClient.getMessage({ id })
      return proxyMessage({ ...props, message: response.message })
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
