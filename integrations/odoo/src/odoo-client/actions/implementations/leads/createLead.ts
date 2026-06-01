import { wrapAction } from '../../action-wrapper'

export const createLead = wrapAction(
  { actionName: 'createLead', errorMessage: 'Failed to create Odoo lead' },
  async ({ odooClient }, input) => {
    const id = await odooClient.createLead(input)

    return { id }
  }
)
