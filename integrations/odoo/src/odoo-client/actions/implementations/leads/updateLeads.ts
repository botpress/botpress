import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const updateLeads = wrapAction(
  { actionName: 'updateLeads', errorMessage: 'Failed to update Odoo leads' },
  async ({ odooClient }, input) => {
    const success = await odooClient.updateLeads(input)

    if (!success) {
      throw new sdk.RuntimeError(
        `Odoo returned false while updating lead IDs ${input.ids.join(
          ', '
        )}. The update was not applied; verify the lead IDs, field names, values, and user permissions.`
      )
    }

    return { updatedIds: input.ids }
  }
)
