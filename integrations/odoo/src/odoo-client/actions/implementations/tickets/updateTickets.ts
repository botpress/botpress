import { wrapAction } from '../../action-wrapper'

export const updateTickets = wrapAction(
  { actionName: 'updateTickets', errorMessage: 'Failed to update Odoo tickets' },
  async ({ odooClient }, input) => {
    const success = await odooClient.updateTickets(input)

    return { success }
  }
)
