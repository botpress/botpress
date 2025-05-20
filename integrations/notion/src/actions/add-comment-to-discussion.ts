import { wrapAction } from '../action-wrapper'

export const addCommentToDiscussion = wrapAction(
  { actionName: 'addCommentToDiscussion', errorMessage: 'Failed to add comment to discussion' },
  async ({ notionClient }, { commentBody, discussionId }) => {
    await notionClient.addCommentToDiscussion({ commentBody, discussionId })
  }
)
