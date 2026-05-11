import { wrapAction } from '../action-wrapper'

export const searchTickets = wrapAction(
  { actionName: 'searchTickets', errorMessage: 'Failed to search Freshdesk tickets' },
  async ({ freshdeskClient }, input) => {
    const { results, total } = await freshdeskClient.searchTickets(input)
    return { tickets: results, total }
  }
)
