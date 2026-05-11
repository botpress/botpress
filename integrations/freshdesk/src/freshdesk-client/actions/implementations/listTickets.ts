import { wrapAction } from '../action-wrapper'

export const listTickets = wrapAction(
  { actionName: 'listTickets', errorMessage: 'Failed to list Freshdesk tickets' },
  async ({ freshdeskClient }, input) => {
    const tickets = await freshdeskClient.listTickets(input)
    return { tickets }
  }
)
