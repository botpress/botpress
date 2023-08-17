import * as notion from '../notion'
import type { IntegrationProps } from '.botpress'

export const addCommentToDiscussion: IntegrationProps['actions']['addCommentToDiscussion'] = async ({ ctx, input }) => {
  const response = await notion.addCommentToDiscussion(ctx, input.discussionId, input.commentBody)
  if (response) {
    console.info('Successfully added comment to discussion')
    return {}
  } else {
    return {}
  }
}
