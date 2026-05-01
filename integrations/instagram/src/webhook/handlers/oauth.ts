import { InstagramClient } from 'src/misc/client'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

export const oauthCallbackHandler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { client, ctx, req, logger } = props
  const queryParams = new URLSearchParams(req.query)
  const error = queryParams.get('error')
  if (error) {
    const errorMsg = `OAuth error: ${error} - ${queryParams.get('error_description') ?? ''}`
    logger.forBot().error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  const code = queryParams.get('code')
  if (!code) {
    const errorMsg = 'Authorization code not present in OAuth callback'
    logger.forBot().error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  try {
    const instagramClient = new InstagramClient(logger)

    const accessTokenInfo = await instagramClient.getAccessTokenFromCode(code)
    const { accessToken, expirationTime } = accessTokenInfo
    instagramClient.updateAuthConfig({ accessToken })

    const profile = await instagramClient.getUserProfile('me', ['user_id'])
    const instagramId = profile.user_id
    instagramClient.updateAuthConfig({ instagramId })

    const subscribed = await instagramClient.subscribeToWebhooks(accessToken).then(() => true)
    if (!subscribed) {
      throw new Error('Failed to subscribe to webhooks')
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
      scheduleRegisterCall: 'monthly',
    })
    logger.debug('Token refresh scheduled for Instagram user', instagramId)
    await client.updateUser({ id: ctx.botUserId, tags: { id: instagramId } })
    return generateRedirection(getInterstitialUrl(true))
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to process OAuth callback: ${errorMsg}`)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }
}
