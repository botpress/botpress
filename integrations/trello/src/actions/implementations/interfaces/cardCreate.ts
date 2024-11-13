import { wrapAction } from '../../action-wrapper'

export const cardCreate = wrapAction({ actionName: 'cardCreate' }, async ({ trelloClient }, { item }) => {
  const newCard = await trelloClient.createCard({
    card: item,
  })

  return { item: newCard, meta: {} }
})
