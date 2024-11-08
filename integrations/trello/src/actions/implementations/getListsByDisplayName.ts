import { nameCompare } from 'src/string-utils'
import { wrapAction } from '../action-wrapper'

export const getListsByDisplayName = wrapAction(
  { actionName: 'getListsByDisplayName' },
  async ({ trelloClient }, { boardId, listName }) => {
    const lists = await trelloClient.getListsInBoard({ boardId })
    const matchingLists = lists.filter((l) => nameCompare(l.name, listName))

    return { lists: matchingLists }
  }
)
