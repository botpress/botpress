import { wrapAction } from '../action-wrapper'

export const getPageContent = wrapAction(
  { actionName: 'getPageContent', errorMessage: 'Failed to fetch page content' },
  async ({ notionClient }, { pageId }) => {
    return await notionClient.getPageContent({ pageId })
  }
)