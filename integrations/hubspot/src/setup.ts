import { RuntimeError, isApiError } from '@botpress/sdk'
import { HubspotClient } from './hubspot-api'
import { getAccessToken } from './auth'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger, webhookUrl }) => {
  if (ctx.configurationType === null && bp.secrets.DISABLE_OAUTH === 'true') {
    await client.configureIntegration({
      identifier: null,
    })
    throw new RuntimeError('OAuth currently unavailable, please use manual configuration instead')
  }

  // For manual configuration, check if OAuth is complete
  if (ctx.configurationType === 'manual') {
    try {
      // Try to get access token (will use OAuth state)
      const accessToken = await getAccessToken({ client, ctx })

      // If we got here, OAuth is complete, configure the integration
      const hsClient = new HubspotClient({ accessToken, client, ctx, logger })
      const hubId = await hsClient.getHubId()

      await client.configureIntegration({
        identifier: hubId,
      })
    } catch (error) {
      // OAuth not complete - provide setup instructions
      if (error instanceof RuntimeError && error.message.includes('OAuth credentials not found')) {
        const wizardUrl = `${webhookUrl}/oauth/wizard/start`
        throw new RuntimeError(wizardUrl)
      }
      throw error
    }
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
