import { RuntimeError } from '@botpress/sdk'
import { exchangeCodeForOAuthCredentials, setOAuthCredentials } from '../../auth'
import { HubspotClient } from '../../hubspot-api'
import * as bp from '.botpress'

export const isOAuthCallback = (props: bp.HandlerProps): boolean => props.req.path.startsWith('/oauth')

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ client, ctx, req, logger }) => {
  try {
    const searchParams = new URLSearchParams(req.query)
    const authorizationCode = searchParams.get('code')

    if (!authorizationCode) {
      throw new RuntimeError('Code not present in OAuth callback request')
    }

    logger.forBot().info('Processing OAuth callback')

    // Check if this is a manual config flow by looking for temporary credentials
    let credentials
    let manualCredsState

    try {
      manualCredsState = await client.getState({
        type: 'integration',
        name: 'manualOauthCredentials',
        id: ctx.integrationId,
      })
    } catch (error) {
      // State doesn't exist - this is regular OAuth
      manualCredsState = null
    }

    if (manualCredsState) {
      // Manual config flow: use user's client credentials
      logger.forBot().info('Manual config flow detected')

      const { clientId, clientSecret } = manualCredsState.state.payload

      credentials = await exchangeCodeForOAuthCredentials({
        code: authorizationCode,
        clientId,
        clientSecret,
      })

      // Store credentials with client ID/secret for token refresh
      await setOAuthCredentials({
        client,
        ctx,
        credentials: {
          ...credentials,
          clientId,
          clientSecret,
        },
      })

      // Note: Temporary credentials will remain in state, but that's okay
      logger.forBot().info('Manual OAuth credentials stored successfully')
    } else {
      // Regular OAuth flow: use default credentials
      logger.forBot().info('Regular OAuth flow')
      credentials = await exchangeCodeForOAuthCredentials({ code: authorizationCode })
      await setOAuthCredentials({
        client,
        ctx,
        credentials,
      })
    }

    logger.forBot().info('Configuring integration')
    const hsClient = new HubspotClient({ accessToken: credentials.accessToken, client, ctx, logger })
    const hubId = await hsClient.getHubId()

    await client.configureIntegration({
      identifier: hubId,
    })

    logger.forBot().info('OAuth callback completed successfully')
  } catch (error) {
    logger.forBot().error('OAuth callback failed:', error)
    throw new RuntimeError(`OAuth setup failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
