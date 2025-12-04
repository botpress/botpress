import { wrapAction } from '../action-wrapper'

export const appendBlockToPage = wrapAction(
  { actionName: 'appendBlockToPage', errorMessage: 'Failed to append block to page' },
  async ({ notionClient }, { pageId, block }) => {
    await notionClient.appendBlockToPage({ pageId, block: block as any })
  }
)

