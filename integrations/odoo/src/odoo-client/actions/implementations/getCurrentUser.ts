import { wrapAction } from '../action-wrapper'

export const getCurrentUser = wrapAction(
  { actionName: 'getCurrentUser', errorMessage: 'Failed to get current Odoo user' },
  async ({ odooClient }) => {
    const id = await odooClient.getCurrentUserId()

    return { id }
  }
)
