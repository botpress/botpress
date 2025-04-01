import * as notion from '../notion'
import * as bp from '.botpress'

export const addCommentToDiscussion: bp.IntegrationProps['actions']['addCommentToDiscussion'] = async ({
  ctx,
  client,
  input,
}) => {
  const response = await notion.addCommentToDiscussion(ctx, client, input.discussionId, input.commentBody)
  if (response) {
    console.info('Successfully added comment to discussion')
    return {}
  } else {
    return {}
  }
}
