import { addCommentToDiscussion, addCommentToPage } from './notion'
import type { IntegrationProps } from '.botpress'

export const text: IntegrationProps['channels']['comments']['messages']['text'] = async ({ ctx, payload }) => {
  try {
    const response = await addCommentToPage(ctx, payload.pageId, payload.commentBody)
    if (response) {
      console.info('Successfully added comment to page')
    }
  } catch (error) {
    console.error('There was an error adding a comment to the page - ', error)
  }
}

export const discussion: IntegrationProps['channels']['comments']['messages']['discussion'] = async ({
  ctx,
  payload,
}) => {
  try {
    const response = await addCommentToDiscussion(ctx, payload.discussionId, payload.commentBody)
    if (response) {
      console.info('Successfully added comment to discussion')
    }
  } catch (error) {
    console.error('There was an error adding a comment to the discussion - ', error)
  }
}
