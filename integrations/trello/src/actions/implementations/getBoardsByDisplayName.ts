import { nameCompare } from 'src/string-utils'
import { wrapAction } from '../action-wrapper'

export const getBoardsByDisplayName = wrapAction(
  { actionName: 'getBoardsByDisplayName' },
  async ({ trelloClient }, { boardName }) => {
    const boards = await trelloClient.getAllBoards()
    const matchingBoards = boards.filter((b) => nameCompare(b.name, boardName))

    return { boards: matchingBoards }
  }
)
