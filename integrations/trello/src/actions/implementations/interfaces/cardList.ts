import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const cardList = wrapAction({ actionName: 'cardList' }, async ({ trelloClient }, { nextToken: listId }) => {
  if (!listId) {
    throw new sdk.RuntimeError('List ID is required: make sure the nextToken parameter contains the list ID')
  }

  const items = await trelloClient.getCardsInList({ listId })
  return { items, meta: {} }
})
