import { wrapAction } from '../action-wrapper'

export const replyToTicket = wrapAction(
  { actionName: 'replyToTicket', errorMessage: 'Failed to reply to Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticketId = parseInt(input.ticketId, 10)
    if (!Number.isFinite(ticketId) || ticketId <= 0) {
      throw new Error(`Invalid ticket ID: "${input.ticketId}". Must be a positive integer.`)
    }
    const reply = await freshdeskClient.replyToTicket(ticketId, {
      body: input.body,
      cc_emails: input.cc_emails,
    })
    return {
      id: reply.id,
      body: reply.body,
      createdAt: reply.created_at,
    }
  }
)
