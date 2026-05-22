import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const deleteTickets = wrapAction(
  { actionName: 'deleteTickets', errorMessage: 'Failed to delete Odoo tickets' },
  async ({ odooClient }, input) => {
    const success = await odooClient.deleteTickets(input)

    if (!success) {
      throw new sdk.RuntimeError(
        `Odoo returned false while deleting ticket IDs ${input.ids.join(
          ', '
        )}. Verify the ticket IDs and user permissions.`
      )
    }

    return { deletedIds: input.ids }
  }
)
