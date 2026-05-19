import { wrapAction } from '../action-wrapper'

export const deleteTicket = wrapAction(
  { actionName: 'deleteTicket', errorMessage: 'Failed to delete Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    await freshdeskClient.deleteTicket({ id: input.ticketId })
    return {}
  }
)
