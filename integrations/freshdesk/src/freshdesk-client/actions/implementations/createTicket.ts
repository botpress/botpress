import { wrapAction } from '../action-wrapper'

export const createTicket = wrapAction(
  { actionName: 'createTicket', errorMessage: 'Failed to create Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticket = await freshdeskClient.createTicket(input)
    return { ticket }
  }
)
