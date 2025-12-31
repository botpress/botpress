import { wrapAction } from '../action-wrapper'
import { markdownToBlocks } from '@tryfabric/martian'

export const appendBlockToPage = wrapAction(
  { actionName: 'appendBlockToPage', errorMessage: 'Failed to append block to page' },
  async ({ notionClient }, input) => {
    const { pageId, markdownText } = input
    const blocks = markdownToBlocks(markdownText)
    await notionClient.appendBlockToPage({ pageId, blocks })
  }
)
