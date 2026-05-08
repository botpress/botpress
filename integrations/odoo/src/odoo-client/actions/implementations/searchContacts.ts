import { wrapAction } from '../action-wrapper'

export const searchContacts = wrapAction(
  { actionName: 'searchContacts', errorMessage: 'Failed to search Odoo contacts' },
  async ({ odooClient }, input) => {
    const records = await odooClient.searchContacts(input)

    return { records }
  }
)
