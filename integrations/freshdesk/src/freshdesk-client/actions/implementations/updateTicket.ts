import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS, PRIORITY_TO_NUM, STATUS_TO_NUM } from './utils'

export const updateTicket = wrapAction(
  { actionName: 'updateTicket', errorMessage: 'Failed to update Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const id = parseInt(input.ticketId, 10)
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`Invalid ticket ID: "${input.ticketId}". Must be a positive integer.`)
    }
    const ticket = await freshdeskClient.updateTicket({
      id,
      ...(input.status != null && { status: STATUS_TO_NUM[input.status] }),
      ...(input.priority != null && { priority: PRIORITY_TO_NUM[input.priority] }),
      ...(input.responderId != null && input.responderId > 0 && { responder_id: input.responderId }),
      ...(input.groupId != null && input.groupId > 0 && { group_id: input.groupId }),
      ...(input.custom_fields != null && { custom_fields: input.custom_fields }),
    })
    return {
      id: ticket.id,
      status: NUM_TO_STATUS[ticket.status as keyof typeof NUM_TO_STATUS] ?? 'open',
      priority: NUM_TO_PRIORITY[ticket.priority as keyof typeof NUM_TO_PRIORITY] ?? 'medium',
      updatedAt: ticket.updated_at,
    }
  }
)
