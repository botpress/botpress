import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const boardRead = wrapAction({ actionName: 'boardRead' }, async ({ trelloClient }, { id: boardId }) => {
  if (!boardId) {
    throw new sdk.RuntimeError('Board ID is required: make sure the id parameter contains the board ID')
  }

  const item = await trelloClient.getBoardById({ boardId })
  return { item, meta: {} }
})
