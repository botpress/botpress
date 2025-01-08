import { wrapAction } from '../action-wrapper'

export const getAllBoardMembers = wrapAction(
  { actionName: 'getAllBoardMembers' },
  async ({ trelloClient }, { boardId }) => {
    const members = await trelloClient.getBoardMembers({ boardId })
    return { members }
  }
)
