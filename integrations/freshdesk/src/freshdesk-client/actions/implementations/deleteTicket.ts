import { wrapAction } from '../action-wrapper'

export const deleteTicket = wrapAction(
  { actionName: 'deleteTicket', errorMessage: 'Failed to delete Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const id = parseInt(input.ticketId, 10)
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`Invalid ticket ID: "${input.ticketId}". Must be a positive integer.`)
    }
    await freshdeskClient.deleteTicket({ id })
    return {}
  }
)
