import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getSuncoClient } from './client'
import { getMediaMetadata } from './util'
import * as bp from '.botpress'

const wrapChannel = bpCommon.createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    suncoClient({ ctx }) {
      return getSuncoClient(ctx.configuration)
    },

    async suncoUserId({ client, payload, user: attachedUser }) {
      const user = payload.userId ? (await client.getUser({ id: payload.userId })).user : attachedUser
      return user.tags.id
    },

    async suncoConversationId({ conversation }) {
      const suncoConversationId = conversation.tags.id

      if (!suncoConversationId) {
        throw new sdk.RuntimeError('Sunco conversation id not found')
      }

      return suncoConversationId
    },
  },
})

export const channels = {
  hitl: {
    messages: {
      text: wrapChannel(
        { channelName: 'hitl', messageType: 'text' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'text', text: payload.text },
          ])
          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      image: wrapChannel(
        { channelName: 'hitl', messageType: 'image' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'image', mediaUrl: payload.imageUrl },
          ])
          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const metadata = await getMediaMetadata(payload.audioUrl)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'file', mediaUrl: payload.audioUrl, mediaType: metadata.mimeType },
          ])

          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const metadata = await getMediaMetadata(payload.videoUrl)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'file', mediaUrl: payload.videoUrl, mediaType: metadata.mimeType },
          ])
          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const metadata = await getMediaMetadata(payload.fileUrl)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            {
              type: 'file',
              mediaUrl: payload.fileUrl,
              mediaType: metadata.mimeType,
            },
          ])
          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      bloc: wrapChannel(
        { channelName: 'hitl', messageType: 'bloc' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          for (const item of payload.items) {
            switch (item.type) {
              case 'text':
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'text', text: item.payload.text },
                ])
                break
              case 'markdown':
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'text', text: item.payload.markdown },
                ])
                break
              case 'image':
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'image', mediaUrl: item.payload.imageUrl },
                ])
                break
              case 'video':
                const videoMetadata = await getMediaMetadata(item.payload.videoUrl)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'file', mediaUrl: item.payload.videoUrl, mediaType: videoMetadata.mimeType },
                ])
                break
              case 'audio':
                const audioMetadata = await getMediaMetadata(item.payload.audioUrl)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'file', mediaUrl: item.payload.audioUrl, mediaType: audioMetadata.mimeType },
                ])
                break
              case 'file':
                const fileMetadata = await getMediaMetadata(item.payload.fileUrl)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  {
                    type: 'file',
                    mediaUrl: item.payload.fileUrl,
                    mediaType: fileMetadata.mimeType,
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

                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'text', text: messageParts.join('\n') },
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
