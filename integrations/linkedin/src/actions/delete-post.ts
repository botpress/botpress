import { LinkedInClient } from '../linkedin-api'
import * as bp from '.botpress'

export const deletePost: bp.IntegrationProps['actions']['deletePost'] = async ({ client, ctx, input, logger }) => {
  const { postUrn } = input

  const linkedIn = await LinkedInClient.create({ client, ctx, logger })

  await linkedIn.posts.deletePost(postUrn)

  logger.forBot().info('Post deleted successfully', { postUrn })

  return { success: true }
}
