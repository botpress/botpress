import { wrapAction } from '../action-wrapper'

export const createContact = wrapAction(
  { actionName: 'createContact', errorMessage: 'Failed to create Odoo contact' },
  async ({ odooClient }, input) => {
    const id = await odooClient.createContact(input)

    return { id }
  }
)
