import { wrapAction } from '../../action-wrapper'

export const listTicketFields = wrapAction(
  { actionName: 'listTicketFields', errorMessage: 'Failed to list Odoo ticket fields' },
  async ({ odooClient }, input) => {
    const fields = await odooClient.listTicketFields(input)

    return { fields }
  }
)
