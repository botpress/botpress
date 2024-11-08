import { wrapAction } from '../action-wrapper'

export const getAllBoards = wrapAction({ actionName: 'getAllBoards' }, async ({ trelloClient }) => {
  const boards = await trelloClient.getAllBoards()
  return { boards }
})
