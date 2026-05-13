import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS, PRIORITY_TO_NUM, STATUS_TO_NUM } from './utils'

export const updateTicket = wrapAction(
  { actionName: 'updateTicket', errorMessage: 'Failed to update Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticket = await freshdeskClient.updateTicket({
      id: parseInt(input.ticketId, 10),
      ...(input.status != null && { status: STATUS_TO_NUM[input.status] }),
      ...(input.priority != null && { priority: PRIORITY_TO_NUM[input.priority] }),
      ...(input.responderId != null && { responder_id: input.responderId }),
      ...(input.groupId != null && { group_id: input.groupId }),
      ...(input.customFields != null && { custom_fields: input.customFields }),
    })
    return {
      id: ticket.id,
      status: NUM_TO_STATUS[ticket.status as keyof typeof NUM_TO_STATUS] ?? 'open',
      priority: NUM_TO_PRIORITY[ticket.priority as keyof typeof NUM_TO_PRIORITY] ?? 'medium',
      updatedAt: ticket.updated_at,
    }
  }
)
