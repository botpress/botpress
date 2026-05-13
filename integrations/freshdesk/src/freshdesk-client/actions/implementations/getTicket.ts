import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS } from './utils'

export const getTicket = wrapAction(
  { actionName: 'getTicket', errorMessage: 'Failed to get Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticket = await freshdeskClient.getTicket({ id: parseInt(input.ticketId, 10) })
    return {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description ?? null,
      status: NUM_TO_STATUS[ticket.status as keyof typeof NUM_TO_STATUS] ?? 'open',
      priority: NUM_TO_PRIORITY[ticket.priority as keyof typeof NUM_TO_PRIORITY] ?? 'medium',
      requesterId: ticket.requester_id ?? null,
      responderId: ticket.responder_id ?? null,
      groupId: ticket.group_id ?? null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      tags: ticket.tags ?? null,
      customFields: ticket.custom_fields ?? null,
    }
  }
)
