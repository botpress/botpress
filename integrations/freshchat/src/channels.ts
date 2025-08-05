import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getFreshchatClient } from './client'
import { getMediaMetadata } from './util'
import * as bp from '.botpress'

const wrapChannel = bpCommon.createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    freshchatClient({ ctx, logger }) {
      return getFreshchatClient({ ...ctx.configuration }, logger)
    },

    async freshchatUserId({ client, payload, user: attachedUser }) {
      const user = payload.userId ? (await client.getUser({ id: payload.userId })).user : attachedUser
      return user.tags.id
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
          const freshchatMessageId = await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
            { text: { content: payload.text } },
          ])
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      image: wrapChannel(
        { channelName: 'hitl', messageType: 'image' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const freshchatMessageId = await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
            { image: { url: payload.imageUrl } },
          ])
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const metadata = await getMediaMetadata(payload.audioUrl)
          const freshchatMessageId = await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
            { video: { url: payload.audioUrl, content_type: metadata.mimeType } },
          ])

          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const metadata = await getMediaMetadata(payload.videoUrl)
          const freshchatMessageId = await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
            { video: { url: payload.videoUrl, content_type: metadata.mimeType } },
          ])
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          const metadata = await getMediaMetadata(payload.fileUrl)
          const freshchatMessageId = await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
            {
              file: {
                url: payload.fileUrl,
                name: payload.title || metadata.fileName || 'file',
                contentType: metadata.mimeType,
              },
            },
          ])
          await ack({
            tags: { id: freshchatMessageId },
          })
        }
      ),

      bloc: wrapChannel(
        { channelName: 'hitl', messageType: 'bloc' },
        async ({ ack, payload, freshchatClient, freshchatUserId, freshchatConversationId }) => {
          for (const item of payload.items) {
            switch (item.type) {
              case 'text':
                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  { text: { content: item.payload.text } },
                ])
                break
              case 'markdown':
                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  { text: { content: item.payload.markdown } },
                ])
                break
              case 'image':
                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  { image: { url: item.payload.imageUrl } },
                ])
                break
              case 'video':
                const videoMetadata = await getMediaMetadata(item.payload.videoUrl)
                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  { video: { url: item.payload.videoUrl, content_type: videoMetadata.mimeType } },
                ])
                break
              case 'audio':
                const audioMetadata = await getMediaMetadata(item.payload.audioUrl)
                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  { video: { url: item.payload.audioUrl, content_type: audioMetadata.mimeType } },
                ])
                break
              case 'file':
                const fileMetadata = await getMediaMetadata(item.payload.fileUrl)
                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  {
                    file: {
                      url: item.payload.fileUrl,
                      name: item.payload.title || fileMetadata.fileName || 'file',
                      contentType: fileMetadata.mimeType,
                    },
                  },
                ])
                break
              case 'location':
                const { title, address, latitude, longitude } = item.payload
                const messageParts = []

                if (title) {
                  messageParts.push(title, '')
                }
                if (address) {
                  messageParts.push(address, '')
                }
                messageParts.push(`Latitude: ${latitude}`, `Longitude: ${longitude}`)

                await freshchatClient.sendMessage(freshchatUserId, freshchatConversationId, [
                  { text: { content: messageParts.join('\n') } },
                ])
                break
              default:
                item satisfies never
            }
          }

          await ack({ tags: {} })
        }
      ),
    },
  },
} satisfies bp.IntegrationProps['channels']
