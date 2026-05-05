import { LinkedInClient } from '../linkedin-api'
import * as bp from '.botpress'

export const createPost: bp.IntegrationProps['actions']['createPost'] = async ({ client, ctx, input, logger }) => {
  const { text, visibility, imageUrl, articleUrl, articleTitle, articleDescription } = input

  const linkedIn = await LinkedInClient.create({ client, ctx, logger })

  if (imageUrl) {
    logger.forBot().info('Processing image for LinkedIn post...')
  }

  const result = await linkedIn.posts.createPost({
    authorUrn: linkedIn.authorUrn,
    text,
    visibility,
    imageUrl,
    articleUrl,
    articleTitle,
    articleDescription,
  })

  logger.forBot().info('Post created successfully', { postUrn: result.postUrn })

  return result
}
