import { wrapAction } from '../action-wrapper'

export const getListsInBoard = wrapAction({ actionName: 'getListsInBoard' }, async ({ trelloClient }, { boardId }) => {
  const matchingLists = await trelloClient.getListsInBoard({ boardId })

  return { lists: matchingLists }
})
