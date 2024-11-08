import { wrapAction } from '../action-wrapper'

export const getCardById = wrapAction({ actionName: 'getCardById' }, async ({ trelloClient }, { cardId }) => {
  const card = await trelloClient.getCardById({ cardId })
  return { card }
})
