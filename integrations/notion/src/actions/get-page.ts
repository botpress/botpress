import { wrapAction } from '../action-wrapper'

export const getPage = wrapAction(
  { actionName: 'getPage', errorMessage: 'Failed to fetch page' },
  async ({ notionClient }, { pageId }) => {
    const page = await notionClient.getPage({ pageId })
    return page ?? {}
  }
)
