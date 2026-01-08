import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getSuncoClient, SuncoClient } from './client'
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
          const mediaUrl = await getMediaUrl(payload.imageUrl, suncoClient, suncoConversationId)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'image', mediaUrl },
          ])
          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const mediaUrl = await getMediaUrl(payload.audioUrl, suncoClient, suncoConversationId)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'file', mediaUrl },
          ])

          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const mediaUrl = await getMediaUrl(payload.videoUrl, suncoClient, suncoConversationId)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            { type: 'file', mediaUrl },
          ])
          await ack({
            tags: { id: suncoMessage.id },
          })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, suncoClient, suncoUserId, suncoConversationId }) => {
          const mediaUrl = await getMediaUrl(payload.fileUrl, suncoClient, suncoConversationId)
          const suncoMessage = await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
            {
              type: 'file',
              mediaUrl,
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
              case 'image': {
                const imageMediaUrl = await getMediaUrl(item.payload.imageUrl, suncoClient, suncoConversationId)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'image', mediaUrl: imageMediaUrl },
                ])
                break
              }
              case 'video': {
                const videoMediaUrl = await getMediaUrl(item.payload.videoUrl, suncoClient, suncoConversationId)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'file', mediaUrl: videoMediaUrl },
                ])
                break
              }
              case 'audio': {
                const audioMediaUrl = await getMediaUrl(item.payload.audioUrl, suncoClient, suncoConversationId)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  { type: 'file', mediaUrl: audioMediaUrl },
                ])
                break
              }
              case 'file': {
                const fileMediaUrl = await getMediaUrl(item.payload.fileUrl, suncoClient, suncoConversationId)
                await suncoClient.sendMessages(suncoConversationId, suncoUserId, [
                  {
                    type: 'file',
                    mediaUrl: fileMediaUrl,
                  },
                ])
                break
              }
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

/**
 * Gets the media URL for sending in messages.
 * If the source URL is from Zendesk, uploads it to Zendesk's Attachments API.
 * Otherwise, returns the original URL as-is.
 * The reason for this is that Zendesk will fail the sendMessage request if the URL is from
 * another Sunco Conversation.
 */
async function getMediaUrl(sourceUrl: string, suncoClient: SuncoClient, suncoConversationId: string): Promise<string> {
  try {
    const hostname = new URL(sourceUrl).hostname
    if (hostname.endsWith('zendesk.com')) {
      return suncoClient.downloadAndUploadAttachment(sourceUrl, suncoConversationId)
    }
  } catch {
    // Invalid URL or error, return as-is
  }
  return sourceUrl
}
