import { wrapAction } from '../action-wrapper'
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';


export const appendBlockToPage = wrapAction(
  { actionName: 'appendBlockToPage', errorMessage: 'Failed to append block to page' },
  async ({ notionClient }, input) => {
    await notionClient.appendBlockToPage({ pageId: input.pageId, block: input.block as BlockObjectRequest })
  }
)
