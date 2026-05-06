import { wrapAction } from '../action-wrapper'

export const getLeads = wrapAction(
  { actionName: 'getLeads', errorMessage: 'Failed to get Odoo leads' },
  async ({ odooClient }, input) => {
    const records = await odooClient.getLeads(input)

    return { records }
  }
)
