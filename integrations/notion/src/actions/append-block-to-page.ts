import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints'
import { wrapAction } from '../action-wrapper'

export const appendBlockToPage = wrapAction(
  { actionName: 'appendBlockToPage', errorMessage: 'Failed to append block to page' },
  async ({ notionClient }, input) => {
    await notionClient.appendBlockToPage({ pageId: input.pageId, block: input.block as BlockObjectRequest })
  }
)
