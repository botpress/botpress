import { wrapAction } from '../action-wrapper'

export const replyToTicket = wrapAction(
  { actionName: 'replyToTicket', errorMessage: 'Failed to reply to Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const reply = await freshdeskClient.replyToTicket(parseInt(input.ticketId, 10), {
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
