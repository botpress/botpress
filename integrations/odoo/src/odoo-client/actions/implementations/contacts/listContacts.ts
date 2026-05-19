import { wrapAction } from '../../action-wrapper'

export const listContacts = wrapAction(
  { actionName: 'listContacts', errorMessage: 'Failed to list Odoo contacts' },
  async ({ odooClient }, input) => {
    const records = await odooClient.listContacts(input)

    return { records }
  }
)
