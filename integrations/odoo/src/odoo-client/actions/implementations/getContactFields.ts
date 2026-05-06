import { wrapAction } from '../action-wrapper'

export const getContactFields = wrapAction(
  { actionName: 'getContactFields', errorMessage: 'Failed to get Odoo contact fields' },
  async ({ odooClient }, input) => {
    const fields = await odooClient.getFields('Contact', input)

    return { fields }
  }
)
