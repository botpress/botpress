import { wrapAction } from '../action-wrapper'

export const getContacts = wrapAction(
  { actionName: 'getContacts', errorMessage: 'Failed to get Odoo contacts' },
  async ({ odooClient }, input) => {
    const records = await odooClient.getContacts(input)

    return { records }
  }
)
