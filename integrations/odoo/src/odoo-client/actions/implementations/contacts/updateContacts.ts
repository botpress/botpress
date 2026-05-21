import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const updateContacts = wrapAction(
  { actionName: 'updateContacts', errorMessage: 'Failed to update Odoo contacts' },
  async ({ odooClient }, input) => {
    const success = await odooClient.updateContacts(input)

    if (!success) {
      throw new sdk.RuntimeError(
        `Odoo returned false while updating contact IDs ${input.ids.join(
          ', '
        )}. The update was not applied; verify the contact IDs, field names, values, and user permissions.`
      )
    }

    return { updatedIds: input.ids }
  }
)
