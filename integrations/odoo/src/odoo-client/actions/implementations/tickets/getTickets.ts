import { wrapAction } from '../../action-wrapper'

export const getTickets = wrapAction(
  { actionName: 'getTickets', errorMessage: 'Failed to get Odoo tickets' },
  async ({ odooClient }, input) => {
    const records = await odooClient.getTickets(input)

    return { records }
  }
)
