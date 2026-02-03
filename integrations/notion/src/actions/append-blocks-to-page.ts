import { markdownToBlocks } from '@tryfabric/martian'
import { wrapAction } from '../action-wrapper'

export const appendBlocksToPage = wrapAction(
  { actionName: 'appendBlocksToPage', errorMessage: 'Failed to append blocks to page' },
  async ({ notionClient }, input) => {
    const { pageId, markdownText } = input
    const blocks = markdownToBlocks(markdownText)
    // @ts-expect-error - @tryfabric/martian uses notion@1.0.4 types which needs to be updated to notion@5.6.0 but it works. To find a better solution
    return await notionClient.appendBlocksToPage({ pageId, blocks })
  }
)
