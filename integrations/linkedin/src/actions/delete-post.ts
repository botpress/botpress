import * as sdk from '@botpress/sdk'
import { LinkedInOAuthClient, formatLinkedInError } from '../linkedin-api/linkedin-oauth-client'
import * as bp from '.botpress'

const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest'
const LINKEDIN_API_VERSION = '202511'

export const deletePost: bp.IntegrationProps['actions']['deletePost'] = async ({ client, ctx, input, logger }) => {
  const { postUrn } = input

  const oauthClient = await LinkedInOAuthClient.createFromState({ client, ctx })
  const accessToken = await oauthClient.getAccessToken()

  const encodedUrn = encodeURIComponent(postUrn)

  const response = await fetch(`${LINKEDIN_REST_BASE}/posts/${encodedUrn}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
  })

  if (response.status === 204 || response.status === 404) {
    if (response.status === 404) {
      logger.forBot().warn('Post already deleted or not found', { postUrn })
    } else {
      logger.forBot().info('Post deleted successfully', { postUrn })
    }
    return { success: true }
  }

  if (!response.ok) {
    const errorMsg = await formatLinkedInError(response, 'Failed to delete LinkedIn post')
    throw new sdk.RuntimeError(errorMsg)
  }

  return { success: true }
}
