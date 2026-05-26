import { createChannelWrapper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { FreshdeskClient } from '../FreshdeskClient'
import * as bp from '.botpress'

const _wrapNoteChannel = createChannelWrapper<bp.IntegrationProps>()({
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
    isPrivate: ({ message }) => message.tags.isPrivate === 'true',
  },
})

const _sendNote = async (
  freshdeskClient: FreshdeskClient,
  ticketId: number,
  body: string,
  isPrivate: boolean,
  ack: (args: { tags: Record<string, string> }) => Promise<void>
) => {
  const result = await freshdeskClient.addNote(ticketId, { body, private: isPrivate })
  await ack({ tags: { freshdeskCommentId: String(result.id) } })
}

export default {
  note: {
    messages: {
      text: _wrapNoteChannel(
        { channelName: 'note', messageType: 'text' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName, isPrivate }) =>
          _sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.text}`, isPrivate, ack)
      ),
      audio: _wrapNoteChannel(
        { channelName: 'note', messageType: 'audio' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName, isPrivate }) =>
          _sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.audioUrl}`, isPrivate, ack)
      ),
      file: _wrapNoteChannel(
        { channelName: 'note', messageType: 'file' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName, isPrivate }) =>
          _sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.fileUrl}`, isPrivate, ack)
      ),
      image: _wrapNoteChannel(
        { channelName: 'note', messageType: 'image' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName, isPrivate }) =>
          _sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.imageUrl}`, isPrivate, ack)
      ),
      video: _wrapNoteChannel(
        { channelName: 'note', messageType: 'video' },
        ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName, isPrivate }) =>
          _sendNote(freshdeskClient, freshdeskTicketId, `[${chatbotName}]: ${payload.videoUrl}`, isPrivate, ack)
      ),
      bloc: _wrapNoteChannel(
        { channelName: 'note', messageType: 'bloc' },
        async ({ ack, payload, freshdeskTicketId, freshdeskClient, chatbotName, isPrivate }) => {
          let firstNoteId: string | undefined
          const addNote = async (body: string) => {
            const note = await freshdeskClient.addNote(freshdeskTicketId, { body, private: isPrivate })
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
  reply: {
    messages: {
      text: async ({ ctx, conversation, message, payload, ack, logger }) => {
        const ticketId = conversation.tags.freshdeskTicketId
        if (!ticketId) {
          logger.forBot().error('Conversation is missing freshdeskTicketId tag')
          throw new sdk.RuntimeError('Conversation is missing freshdeskTicketId tag')
        }
        const ccEmails = message.tags.ccEmails ? message.tags.ccEmails.split(',') : []
        const freshdeskClient = new FreshdeskClient(ctx.configuration.domain, ctx.configuration.apiKey)
        const result = await freshdeskClient.replyToTicket(parseInt(ticketId, 10), { body: payload.text, ccEmails })
        await ack({ tags: { freshdeskMessageId: String(result.id) } })
      },
    },
  },
}
