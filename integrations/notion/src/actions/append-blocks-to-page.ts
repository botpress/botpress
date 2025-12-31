import { wrapAction } from '../action-wrapper'
import { markdownToBlocks } from '@tryfabric/martian'

export const appendBlocksToPage = wrapAction(
  { actionName: 'appendBlocksToPage', errorMessage: 'Failed to append blocks to page' },
  async ({ notionClient }, input) => {
    const { pageId, markdownText } = input
    const blocks = markdownToBlocks(markdownText)
    await notionClient.appendBlocksToPage({ pageId, blocks })
  }
)
