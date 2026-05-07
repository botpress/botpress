import { wrapAction } from '../../action-wrapper'

export const deleteLeads = wrapAction(
  { actionName: 'deleteLeads', errorMessage: 'Failed to delete Odoo leads' },
  async ({ odooClient }, input) => {
    const success = await odooClient.deleteLeads(input)

    return { success }
  }
)
