import { InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const oauthCallbackHandler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { client, ctx, req, logger } = props
  const queryParams = new URLSearchParams(req.query)
  const error = queryParams.get('error')
  if (error) {
    return {
      status: 400,
      body: `Error while authenticating with Instagram: ${queryParams.get('error_description') ?? 'Unknown reason'}`,
    }
  }

  const code = queryParams.get('code')
  if (!code) {
    return { status: 400, body: 'No code found in query parameters' }
  }

  const instagramClient = new InstagramClient(logger)

  const accessTokenInfo = await instagramClient.getAccessTokenFromCode(code).catch(() => undefined)
  if (!accessTokenInfo) {
    return { status: 500, body: 'Error while getting access token from Instagram' }
  }
  const { accessToken, expirationTime } = accessTokenInfo
  instagramClient.updateAuthConfig({ accessToken })

  const profile = await instagramClient.getUserProfile('me', ['user_id']).catch(() => undefined)
  if (!profile) {
    return { status: 500, body: 'Error while getting user profile from Instagram' }
  }
  const instagramId = profile.user_id
  instagramClient.updateAuthConfig({ instagramId })

  const subscribed = await instagramClient
    .subscribeToWebhooks(accessToken)
    .then(() => true)
    .catch(() => false)
  if (!subscribed) {
    return { status: 500, body: 'Error while subscribing to webhooks' }
  }
  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      accessToken,
      instagramId,
      expirationTime,
    },
  })

  await client.configureIntegration({
    identifier: instagramId,
    scheduleRegisterCall: 'monthly', // Refresh token before 60 days as per the documentation:
  })
  logger.debug('Token refresh scheduled for Instagram user', instagramId)
  await client.updateUser({ id: ctx.botUserId, tags: { id: instagramId } })
  return { status: 200 }
}
