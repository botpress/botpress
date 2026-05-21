import { wrapAction } from '../../action-wrapper'

export const searchLeads = wrapAction(
  { actionName: 'searchLeads', errorMessage: 'Failed to search Odoo leads' },
  async ({ odooClient }, input) => {
    const records = await odooClient.searchLeads(input)

    return { records }
  }
)
