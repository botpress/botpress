import { wrapAction } from '../../action-wrapper'

export const cardUpdate = wrapAction({ actionName: 'cardUpdate' }, async ({ trelloClient }, { item }) => {
  const newCard = await trelloClient.updateCard({
    partialCard: item,
  })

  return { item: newCard, meta: {} }
})
