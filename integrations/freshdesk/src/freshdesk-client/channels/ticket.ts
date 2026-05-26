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

const sendNote = async (
  freshdeskClient: FreshdeskClient,
  ticketId: number,
  body: string,
  ack: (args: { tags: Record<string, string> }) => Promise<void>
) => {
  const result = await freshdeskClient.addNote(ticketId, { body, private: false })
  await ack({ tags: { freshdeskCommentId: String(result.id) } })
}

export default {
  ticket: {
    messages: {
      text: wrapChannel(
        { channelName: 'ticket', messageType: 'text' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) =>
          sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.text}`, ack)
      ),
      audio: wrapChannel(
        { channelName: 'ticket', messageType: 'audio' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) =>
          sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.audioUrl}`, ack)
      ),
      file: wrapChannel(
        { channelName: 'ticket', messageType: 'file' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) =>
          sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.fileUrl}`, ack)
      ),
      image: wrapChannel(
        { channelName: 'ticket', messageType: 'image' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) =>
          sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.imageUrl}`, ack)
      ),
      video: wrapChannel(
        { channelName: 'ticket', messageType: 'video' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName }) =>
          sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.videoUrl}`, ack)
      ),
      bloc: wrapChannel(
        { channelName: 'ticket', messageType: 'bloc' },
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
