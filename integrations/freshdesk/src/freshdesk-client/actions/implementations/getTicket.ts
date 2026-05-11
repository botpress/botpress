import { wrapAction } from '../action-wrapper'

export const getTicket = wrapAction(
  { actionName: 'getTicket', errorMessage: 'Failed to get Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticket = await freshdeskClient.getTicket(input)
    return { ticket }
  }
)
