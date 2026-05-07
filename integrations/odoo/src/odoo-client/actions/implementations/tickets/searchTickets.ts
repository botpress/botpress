import { wrapAction } from '../../action-wrapper'

export const searchTickets = wrapAction(
  { actionName: 'searchTickets', errorMessage: 'Failed to search Odoo tickets' },
  async ({ odooClient }, input) => {
    const records = await odooClient.searchTickets(input)

    return { records }
  }
)
