import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const oauthCallbackHandler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { client, ctx, req, logger } = props

  try {
    const queryParams = new URLSearchParams(req.query)
    const error = queryParams.get('error')
    if (error) {
      throw new Error(`${error} - ${queryParams.get('error_description') ?? ''}`)
    }

    const code = queryParams.get('code')
    if (!code) {
      throw new Error('Authorization code not present in OAuth callback')
    }

    const instagramClient = new InstagramClient(logger)

    const accessTokenInfo = await instagramClient.getAccessTokenFromCode(code)
    const { accessToken, expirationTime } = accessTokenInfo
    instagramClient.updateAuthConfig({ accessToken })

    const profile = await instagramClient.getUserProfile('me', ['user_id'])
    const instagramId = profile.user_id
    instagramClient.updateAuthConfig({ instagramId })

    await instagramClient.subscribeToWebhooks(accessToken)

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

    // Refresh token before 60 days, as indicated in the documentation:
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#long-lived
    await client.configureIntegration({
      identifier: instagramId,
      scheduleRegisterCall: 'monthly',
    })
    logger.debug('Token refresh scheduled for Instagram user', instagramId)
    await client.updateUser({ id: ctx.botUserId, tags: { id: instagramId } })
    return generateRedirection(getInterstitialUrl(true))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const errorMessage = 'OAuth error: ' + msg
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}
