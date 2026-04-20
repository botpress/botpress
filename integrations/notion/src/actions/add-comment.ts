import { wrapAction } from '../action-wrapper'

export const addComment = wrapAction(
  { actionName: 'addComment', errorMessage: 'Failed to add comment' },
  async (
    { notionClient },
    { parentType, parentId, commentBody }: { parentType: string; parentId: string; commentBody: string }
  ) => {
    return await notionClient.addComment({ parentType, parentId, commentBody })
  }
)
