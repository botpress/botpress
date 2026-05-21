import { wrapAction } from '../../action-wrapper'

export const listContactFields = wrapAction(
  { actionName: 'listContactFields', errorMessage: 'Failed to list Odoo contact fields' },
  async ({ odooClient }, input) => {
    const fields = await odooClient.listFields('Contact', input)

    return { fields }
  }
)
