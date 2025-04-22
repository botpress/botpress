import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getFreshchatClient } from './client'
import * as bp from '.botpress'

const wrapChannel = bpCommon.createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    freshchatClient({ ctx, logger }) {
      return getFreshchatClient({ ...ctx.configuration }, logger)
    },

    async freshchatUserId({ client, payload, user: attachedUser }) {
      const user = payload.userId ? (await client.getUser({ id: payload.userId })).user : attachedUser
      const freshchatUserId = user.tags.id

      if (!freshchatUserId) {
        throw new sdk.RuntimeError('Freshchat user id not found')
      }

      return freshchatUserId
    },

    async freshchatConversationId({ conversation }) {
      const freshchatConversationId = conversation.tags.id

      if (!freshchatConversationId) {
        throw new sdk.RuntimeError('Freshchat conversation id not found')
      }

      return freshchatConversationId
    },
  },
})

export const channels = {
  hitl: {
    messages: {
      text: wrapChannel(
        { channelName: 'hitl', messageType: 'text' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const freshchatMessageId = await freshchatClient.sendMessage(
            freshchatUserId,
            freshchatConversationId,
            payload.text
          )
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      image: wrapChannel(
        { channelName: 'hitl', messageType: 'image' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const freshchatMessageId = await freshchatClient.sendMessage(
            freshchatUserId,
            freshchatConversationId,
            payload.imageUrl
          )
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const freshchatMessageId = await freshchatClient.sendMessage(
            freshchatUserId,
            freshchatConversationId,
            payload.audioUrl
          )
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const freshchatMessageId = await freshchatClient.sendMessage(
            freshchatUserId,
            freshchatConversationId,
            payload.videoUrl
          )
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const freshchatMessageId = await freshchatClient.sendMessage(
            freshchatUserId,
            freshchatConversationId,
            payload.fileUrl
          )
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),
    },
  },
} satisfies bp.IntegrationProps['channels']
