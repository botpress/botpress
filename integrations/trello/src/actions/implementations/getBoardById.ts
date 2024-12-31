import { wrapAction } from '../action-wrapper'

export const getBoardById = wrapAction({ actionName: 'getBoardById' }, async ({ trelloClient }, { boardId }) => {
  const board = await trelloClient.getBoardById({ boardId })
  return { board }
})
