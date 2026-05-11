import { wrapAction } from '../action-wrapper'

export const updateTicket = wrapAction(
  { actionName: 'updateTicket', errorMessage: 'Failed to update Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticket = await freshdeskClient.updateTicket(input)
    return { ticket }
  }
)
