import { wrapAction } from '../../action-wrapper'
import * as sdk from '@botpress/sdk'

export const cardRead = wrapAction({ actionName: 'cardRead' }, async ({ trelloClient }, { id: cardId }) => {
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the id parameter contains the card ID')
  }

  const item = await trelloClient.getCardById({ cardId })
  return { item, meta: {} }
})
