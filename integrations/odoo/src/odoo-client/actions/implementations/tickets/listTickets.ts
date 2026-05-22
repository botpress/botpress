import { wrapAction } from '../../action-wrapper'

export const listTickets = wrapAction(
  { actionName: 'listTickets', errorMessage: 'Failed to list Odoo tickets' },
  async ({ odooClient }, input) => {
    const records = await odooClient.listTickets(input)

    return { records }
  }
)
