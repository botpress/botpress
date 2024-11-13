import { wrapAction } from '../../action-wrapper'

export const boardList = wrapAction({ actionName: 'boardList' }, async ({ trelloClient }) => ({
  items: await trelloClient.getAllBoards(),
  meta: {},
}))
