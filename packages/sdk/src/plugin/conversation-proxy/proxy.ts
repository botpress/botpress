import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'

import type { BasePlugin, PluginRuntimeProps } from '../common'
import { notFoundErrorToUndefined } from '../../utils/error-utils'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../tag-prefixer'
import type { ActionableConversation, ConversationFinder } from './types'
import { proxyUser } from '../user-proxy'
import { proxyMessage } from '../message-proxy/proxy'
import { createAsyncCollection } from '../../utils/api-paging-utils'

export const proxyConversations = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
}): ConversationFinder<TPlugin> => ({
  forIntegration: (integrationAlias) => ({
    onChannel: (channelName) => ({
      list(listProps) {
        return createAsyncCollection(({ nextToken }) =>
          props.client
            .listConversations({
              ...prefixTagsIfNeeded(listProps, { alias: props.plugin?.alias }),
              channel: channelName as string,
              integrationName: integrationAlias as string,
              nextToken,
            })
            .then(({ meta, conversations }) => ({
              meta,
              items: conversations.map((conversation) => proxyConversation({ ...props, conversation })),
            }))
        )
      },
    }),
  }),

  forInterface: (interfaceAlias) => ({
    onChannel: (channelName) => ({
      list(listProps) {
        // FIXME: we should retrieve the integration alias, not the name:
        const integrationName = props.plugin?.interfaces[interfaceAlias].name

        return createAsyncCollection(({ nextToken }) =>
          props.client
            .listConversations({
              ...prefixTagsIfNeeded(listProps, { alias: props.plugin?.alias }),
              channel: channelName as string,
              integrationName,
              nextToken,
            })
            .then(({ meta, conversations }) => ({
              meta,
              items: conversations.map((conversation) => proxyConversation({ ...props, conversation })),
            }))
        )
      },
    }),
  }),

  async getById({ id }) {
    const response = await notFoundErrorToUndefined(props.client.getConversation({ id }))
    return response ? proxyConversation({ ...props, conversation: response.conversation }) : undefined
  },
})

export const proxyConversation = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  plugin?: PluginRuntimeProps<TPlugin>
  conversation: client.Conversation
}): ActionableConversation<TPlugin> => {
  // Client.GetMessageResponse conflicts with MessageResponse<TPlugin>:
  const vanillaClient = props.client as client.Client

  return {
    ...unprefixTagsOwnedByPlugin(props.conversation, { alias: props.plugin?.alias }),

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
            ...prefixTagsIfNeeded(listProps, { alias: props.plugin?.alias }),
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
