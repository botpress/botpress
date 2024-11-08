import { wrapAction } from '../../action-wrapper'
import * as sdk from '@botpress/sdk'

export const listRead = wrapAction({ actionName: 'listRead' }, async ({ trelloClient }, { id: listId }) => {
  if (!listId) {
    throw new sdk.RuntimeError('List ID is required: make sure the id parameter contains the list ID')
  }

  const item = await trelloClient.getListById({ listId })
  return { item, meta: {} }
})
