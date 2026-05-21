import { wrapAction } from '../../action-wrapper'

export const listLeadFields = wrapAction(
  { actionName: 'listLeadFields', errorMessage: 'Failed to list Odoo lead fields' },
  async ({ odooClient }, input) => {
    const fields = await odooClient.listLeadFields(input)

    return { fields }
  }
)
