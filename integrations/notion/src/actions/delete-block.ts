import { wrapAction } from '../action-wrapper'

export const deleteBlock = wrapAction(
  { actionName: 'deleteBlock', errorMessage: 'Failed to delete block' },
  async ({ notionClient }, { blockId }) => {
    return await notionClient.deleteBlock({ blockId })
  }
)
