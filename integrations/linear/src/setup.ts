import { RuntimeError } from '@botpress/client'
import { LinearOauthClient, registerWebhook, revokeToken, unregisterWebhook } from './misc/linear'
import * as bp from '.botpress'

const _isWebhookManuallyRegistered = (ctx: bp.HandlerProps['ctx']) =>
  ctx.configurationType === 'apiKey' && ctx.configuration.webhookSigningSecret

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  const manuallyRegistered = _isWebhookManuallyRegistered(ctx)
  logger.forBot().info('Registering Linear integration.')

  if (!manuallyRegistered) {
    const linearClient = await LinearOauthClient.createAdmin({ client, ctx })
    const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
    logger.forBot().info('Registering Linear webhook')
    try {
      await registerWebhook({ linearClient, logger, url: webhookUrl })
      logger.forBot().info('Linear webhook registered')
    } catch (thrown) {
      const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Failed to register webhook: ${errorMessage}`)
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

    logger.forBot().info('Revoking Linear access token.')
    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: 'credentials',
      id: ctx.integrationId,
    })
    await revokeToken(payload.accessToken)
    logger.forBot().info('Linear integration unregistration completed.')
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().warn('Failed to unregister webhook:', errorMessage)
  }
}
