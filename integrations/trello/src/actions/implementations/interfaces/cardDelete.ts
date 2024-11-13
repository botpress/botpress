import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const cardDelete = wrapAction({ actionName: 'cardDelete' }, async ({ trelloClient }, { id: cardId }) => {
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the id parameter contains the card ID')
  }

  // This effectively archives the card (soft deletion):
  const item = await trelloClient.updateCard({ partialCard: { id: cardId, isClosed: true } })

  return { item, meta: {} }
})
