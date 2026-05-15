import { createChannelWrapper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { FreshdeskClient } from '../FreshdeskClient'
import * as bp from '.botpress'

const wrapChannel = createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    freshdeskTicketId: ({ conversation, logger }) => {
      const ticketId = conversation.tags.freshdeskTicketId
      if (!ticketId) {
        logger.forBot().error('Conversation is missing freshdeskTicketId tag')
        throw new sdk.RuntimeError('Conversation is missing freshdeskTicketId tag')
      }
      return parseInt(ticketId, 10)
    },
    freshdeskClient: ({ ctx }) => new FreshdeskClient(ctx.configuration.domain, ctx.configuration.apiKey),
    chatbotName: async ({ client, ctx }) => {
      const { user } = await client.getUser({ id: ctx.botUserId })
      return user.name ?? 'Botpress'
    },
  },
})

export default {
  hitl: {
    messages: {
      text: wrapChannel(
        { channelName: 'hitl', messageType: 'text' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) => {
          const note = await freshdeskClient.addNote(freshdeskTicketId, {
            body: `[${chatbotName}]: ${payload.text}`,
            private: false,
          })
          await ack({ tags: { freshdeskCommentId: String(note.id) } })
        }
      ),

      image: wrapChannel(
        { channelName: 'hitl', messageType: 'image' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) => {
          const note = await freshdeskClient.addNote(freshdeskTicketId, {
            body: `[${chatbotName}]: ${payload.imageUrl}`,
            private: false,
          })
          await ack({ tags: { freshdeskCommentId: String(note.id) } })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) => {
          const note = await freshdeskClient.addNote(freshdeskTicketId, {
            body: `[${chatbotName}]: ${payload.audioUrl}`,
            private: false,
          })
          await ack({ tags: { freshdeskCommentId: String(note.id) } })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) => {
          const note = await freshdeskClient.addNote(freshdeskTicketId, {
            body: `[${chatbotName}]: ${payload.videoUrl}`,
            private: false,
          })
          await ack({ tags: { freshdeskCommentId: String(note.id) } })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) => {
          const note = await freshdeskClient.addNote(freshdeskTicketId, {
            body: `[${chatbotName}]: ${payload.fileUrl}`,
            private: false,
          })
          await ack({ tags: { freshdeskCommentId: String(note.id) } })
        }
      ),

      bloc: wrapChannel(
        { channelName: 'hitl', messageType: 'bloc' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) => {
          for (const item of payload.items) {
            switch (item.type) {
              case 'text':
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${item.payload.text}`,
                  private: false,
                })
                break
              case 'markdown':
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${item.payload.markdown}`,
                  private: false,
                })
                break
              case 'image':
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${item.payload.imageUrl}`,
                  private: false,
                })
                break
              case 'video':
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${item.payload.videoUrl}`,
                  private: false,
                })
                break
              case 'audio':
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${item.payload.audioUrl}`,
                  private: false,
                })
                break
              case 'file':
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${item.payload.fileUrl}`,
                  private: false,
                })
                break
              case 'location': {
                const { title, address, latitude, longitude } = item.payload
                const parts: string[] = []
                if (title) parts.push(title, '')
                if (address) parts.push(address, '')
                parts.push(`Latitude: ${latitude}`, `Longitude: ${longitude}`)
                await freshdeskClient.addNote(freshdeskTicketId, {
                  body: `[${chatbotName}]: ${parts.join('\n')}`,
                  private: false,
                })
                break
              }
              default:
                item satisfies never
            }
          }

          await ack({ tags: {} })
        }
      ),
    },
  },
}
