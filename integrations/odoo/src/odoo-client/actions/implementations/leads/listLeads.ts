import { wrapAction } from '../../action-wrapper'

export const listLeads = wrapAction(
  { actionName: 'listLeads', errorMessage: 'Failed to list Odoo leads' },
  async ({ odooClient }, input) => {
    const records = await odooClient.listLeads(input)

    return { records }
  }
)
