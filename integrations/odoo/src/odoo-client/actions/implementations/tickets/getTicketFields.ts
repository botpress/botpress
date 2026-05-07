import { wrapAction } from '../../action-wrapper'

export const getTicketFields = wrapAction(
  { actionName: 'getTicketFields', errorMessage: 'Failed to get Odoo ticket fields' },
  async ({ odooClient }, input) => {
    const fields = await odooClient.getTicketFields(input)

    return { fields }
  }
)
