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
          let firstNoteId: string | undefined
          const addNote = async (body: string) => {
            const note = await freshdeskClient.addNote(freshdeskTicketId, { body, private: false })
            firstNoteId ??= String(note.id)
          }

          for (const item of payload.items) {
            switch (item.type) {
              case 'text':
                await addNote(`[${chatbotName}]: ${item.payload.text}`)
                break
              case 'markdown':
                await addNote(`[${chatbotName}]: ${item.payload.markdown}`)
                break
              case 'image':
                await addNote(`[${chatbotName}]: ${item.payload.imageUrl}`)
                break
              case 'video':
                await addNote(`[${chatbotName}]: ${item.payload.videoUrl}`)
                break
              case 'audio':
                await addNote(`[${chatbotName}]: ${item.payload.audioUrl}`)
                break
              case 'file':
                await addNote(`[${chatbotName}]: ${item.payload.fileUrl}`)
                break
              case 'location': {
                const { title, address, latitude, longitude } = item.payload
                const parts: string[] = []
                if (title) parts.push(title, '')
                if (address) parts.push(address, '')
                parts.push(`Latitude: ${latitude}`, `Longitude: ${longitude}`)
                await addNote(`[${chatbotName}]: ${parts.join('\n')}`)
                break
              }
              default:
                item satisfies never
            }
          }

          await ack({ tags: firstNoteId ? { freshdeskCommentId: firstNoteId } : {} })
        }
      ),
    },
  },
}
