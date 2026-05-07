import { wrapAction } from '../../action-wrapper'

export const updateLeads = wrapAction(
  { actionName: 'updateLeads', errorMessage: 'Failed to update Odoo leads' },
  async ({ odooClient }, input) => {
    const success = await odooClient.updateLeads(input)

    return { success }
  }
)
