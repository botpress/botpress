import { RuntimeError } from '@botpress/client'
import { LinearOauthClient, registerWebhook, revokeToken, unregisterWebhook } from './misc/linear'
import * as bp from '.botpress'

const INSUFFICIENT_LINEAR_ROLE_ERROR = 'Invalid role: admin required'
const WEBHOOK_REGISTRATION_ADMIN_REQUIRED_MESSAGE =
  'You must be an admin on the Linear workspace to automatically register webhooks. ' +
  'You may still use the integration without webhooks, but some functionality will be limited or unavailable. ' +
  'In order to fully configure the integration, please connect to a Linear account on which you are an admin.'

const _isWebhookManuallyRegistered = (ctx: bp.HandlerProps['ctx']) =>
  ctx.configurationType === 'apiKey' && ctx.configuration.webhookSigningSecret

const _revokeCredentials = async (credentials: { accessToken?: string; refreshToken?: string }) => {
  if (credentials.accessToken) {
    await revokeToken(credentials.accessToken, 'access_token')
  }
  if (credentials.refreshToken) {
    await revokeToken(credentials.refreshToken, 'refresh_token')
  }
}

const _getWebhookRegistrationErrorMessage = (errorMessage: string) => {
  if (errorMessage.includes(INSUFFICIENT_LINEAR_ROLE_ERROR)) {
    return WEBHOOK_REGISTRATION_ADMIN_REQUIRED_MESSAGE
  }

  return `Failed to register webhook: ${errorMessage}`
}

const _reportWebhookRegistrationIssue = (logger: bp.HandlerProps['logger'], errorMessage: string) => {
  if (!errorMessage.includes(INSUFFICIENT_LINEAR_ROLE_ERROR)) {
    return
  }

  logger.issue({
    type: 'issue',
    title: 'Linear webhook registration requires an admin',
    description: WEBHOOK_REGISTRATION_ADMIN_REQUIRED_MESSAGE,
    category: 'configuration',
    groupBy: ['linear_webhook_admin_required'],
    code: 'linear_webhook_admin_required',
    data: {
      details: {
        raw: INSUFFICIENT_LINEAR_ROLE_ERROR,
        pretty: WEBHOOK_REGISTRATION_ADMIN_REQUIRED_MESSAGE,
      },
    },
  })
}

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  const manuallyRegistered = _isWebhookManuallyRegistered(ctx)
  logger.forBot().info('Registering Linear integration.')

  if (!manuallyRegistered) {
    const {
      state: { payload: environment },
    } = await client.getState({ type: 'integration', name: 'environment', id: ctx.integrationId })

    if (environment.runtimeActor === 'user') {
      logger.forBot().info('Skipping automatic Linear webhook registration: integration is using user-actor OAuth.')
      logger.forBot().info(`Linear integration registered successfully (integrationId="${ctx.integrationId}").`)
      return
    }

    const linearClient = await LinearOauthClient.createAdmin({ client, ctx })
    const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
    logger.forBot().info('Registering Linear webhook')
    try {
      await registerWebhook({ linearClient, logger, url: webhookUrl })
      logger.forBot().info('Linear webhook registered')
    } catch (thrown) {
      const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
      _reportWebhookRegistrationIssue(logger, errorMessage)
      throw new RuntimeError(_getWebhookRegistrationErrorMessage(errorMessage))
    }
  } else {
    logger
      .forBot()
      .info('Skipping automatic Linear webhook registration: webhookSigningSecret is set in apiKey configuration.')
  }
  logger.forBot().info(`Linear integration registered successfully (integrationId="${ctx.integrationId}").`)
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  const manuallyRegistered = _isWebhookManuallyRegistered(ctx)
  logger.forBot().info('Unregistering Linear integration.')

  if (manuallyRegistered) {
    logger.forBot().info('Skipping Linear webhook unregistration: webhook was manually registered.')
    return
  }
  try {
    const linearClient = await LinearOauthClient.createAdmin({ client, ctx })
    const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
    logger.forBot().info('Unregistering Linear webhook.')
    await unregisterWebhook({ linearClient, logger, url: webhookUrl })

    logger.forBot().info('Revoking Linear access tokens.')
    const [{ state: appState }, { state: adminState }] = await Promise.all([
      client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId }),
      client.getState({ type: 'integration', name: 'adminCredentials', id: ctx.integrationId }),
    ])
    await _revokeCredentials(appState.payload)
    if (adminState.payload.accessToken !== appState.payload.accessToken) {
      await _revokeCredentials(adminState.payload)
    }
    logger.forBot().info('Linear integration unregistration completed.')
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().warn('Failed to unregister webhook:', errorMessage)
  }
}
