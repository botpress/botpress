import { wrapAction } from '../action-wrapper'

export const updateContacts = wrapAction(
  { actionName: 'updateContacts', errorMessage: 'Failed to update Odoo contacts' },
  async ({ odooClient }, input) => {
    const success = await odooClient.updateContacts(input)

    return { success }
  }
)
