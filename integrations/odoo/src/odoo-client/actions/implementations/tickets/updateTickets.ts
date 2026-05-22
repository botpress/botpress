import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const updateTickets = wrapAction(
  { actionName: 'updateTickets', errorMessage: 'Failed to update Odoo tickets' },
  async ({ odooClient }, input) => {
    const success = await odooClient.updateTickets(input)

    if (!success) {
      throw new sdk.RuntimeError(
        `Odoo returned false while updating ticket IDs ${input.ids.join(
          ', '
        )}. The update was not applied; verify the ticket IDs, field names, values, and user permissions.`
      )
    }

    return { updatedIds: input.ids }
  }
)
