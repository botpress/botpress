import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS, PRIORITY_TO_NUM, STATUS_TO_NUM } from './const'

export const updateTicket = wrapAction(
  { actionName: 'updateTicket', errorMessage: 'Failed to update Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticket = await freshdeskClient.updateTicket({
      id: input.ticketId,
      ...(input.status != null && { status: STATUS_TO_NUM[input.status] }),
      ...(input.priority != null && { priority: PRIORITY_TO_NUM[input.priority] }),
      ...(input.responderId != null && input.responderId > 0 && { responder_id: input.responderId }),
      ...(input.groupId != null && input.groupId > 0 && { group_id: input.groupId }),
      ...(input.custom_fields != null && { custom_fields: input.custom_fields }),
    })
    return {
      id: ticket.id,
      status: NUM_TO_STATUS[ticket.status as keyof typeof NUM_TO_STATUS],
      priority: NUM_TO_PRIORITY[ticket.priority as keyof typeof NUM_TO_PRIORITY],
      updatedAt: ticket.updated_at,
    }
  }
)
