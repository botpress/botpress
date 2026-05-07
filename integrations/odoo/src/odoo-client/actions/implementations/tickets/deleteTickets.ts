import { wrapAction } from '../../action-wrapper'

export const deleteTickets = wrapAction(
  { actionName: 'deleteTickets', errorMessage: 'Failed to delete Odoo tickets' },
  async ({ odooClient }, input) => {
    const success = await odooClient.deleteTickets(input)

    return { success }
  }
)
