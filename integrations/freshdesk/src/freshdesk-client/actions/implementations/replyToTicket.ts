import * as sdk from '@botpress/sdk'
import { wrapAction } from '../action-wrapper'

export const replyToTicket = wrapAction(
  { actionName: 'replyToTicket', errorMessage: 'Failed to add reply to Freshdesk ticket' },
  async ({ client, ctx }, input) => {
    const { conversations } = await client.listConversations({
      channel: 'reply',
      tags: { freshdeskTicketId: String(input.ticketId) },
    })

    const conversation = conversations[0]
    if (!conversation) {
      throw new sdk.RuntimeError(`No conversation found for Freshdesk ticket ${input.ticketId}`)
    }

    const { message } = await client.createMessage({
      conversationId: conversation.id,
      userId: ctx.botUserId,
      type: 'text',
      payload: { text: input.body },
      tags: { ccEmails: input.ccEmails?.join(',') ?? '' },
    })
    return {
      messageId: message.id,
      body: input.body,
      createdAt: new Date().toISOString(),
    }
  }
)
