import { markdownToBlocks } from '@tryfabric/martian'
import { wrapAction } from '../action-wrapper'
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints'

export const appendBlocksToPage = wrapAction(
  { actionName: 'appendBlocksToPage', errorMessage: 'Failed to append blocks to page' },
  async ({ notionClient }, input) => {
    const { pageId, markdownText } = input
    const blocks = markdownToBlocks(markdownText) as BlockObjectRequest[]
    await notionClient.appendBlocksToPage({ pageId, blocks })
  }
)
