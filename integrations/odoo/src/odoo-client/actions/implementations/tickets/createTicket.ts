import { wrapAction } from '../../action-wrapper'

export const createTicket = wrapAction(
  { actionName: 'createTicket', errorMessage: 'Failed to create Odoo ticket' },
  async ({ odooClient }, input) => {
    const id = await odooClient.createTicket(input)

    return { id }
  }
)
