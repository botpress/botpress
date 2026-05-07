import { wrapAction } from '../../action-wrapper'

export const getLeadFields = wrapAction(
  { actionName: 'getLeadFields', errorMessage: 'Failed to get Odoo lead fields' },
  async ({ odooClient }, input) => {
    const fields = await odooClient.getLeadFields(input)

    return { fields }
  }
)
