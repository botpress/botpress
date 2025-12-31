import { markdownToBlocks } from '@tryfabric/martian'
import { wrapAction } from '../action-wrapper'

export const appendBlocksToPage = wrapAction(
  { actionName: 'appendBlocksToPage', errorMessage: 'Failed to append blocks to page' },
  async ({ notionClient }, input) => {
    const { pageId, markdownText } = input
    const blocks = markdownToBlocks(markdownText)
    await notionClient.appendBlocksToPage({ pageId, blocks })
  }
)
