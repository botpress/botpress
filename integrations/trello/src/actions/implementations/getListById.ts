import { wrapAction } from '../action-wrapper'

export const getListById = wrapAction({ actionName: 'getListById' }, async ({ trelloClient }, { listId }) => {
  const list = await trelloClient.getListById({ listId })

  return { list }
})
