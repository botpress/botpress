import { wrapAction } from '../action-wrapper'

export const addCommentToPage = wrapAction(
  { actionName: 'addCommentToPage', errorMessage: 'Failed to add comment to page' },
  async ({ notionClient }, { commentBody, pageId }) => {
    await notionClient.addCommentToPage({ commentBody, pageId })
  }
)
