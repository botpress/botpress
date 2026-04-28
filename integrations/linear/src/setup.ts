import { LinearOauthClient, registerWebhook, unregisterWebhook } from './misc/linear'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  logger.forBot().info('Registering integration...')
  const linearClient = await LinearOauthClient.create({ client, ctx })
  if (ctx.configurationType === 'apiKey') {
    const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
    try {
      await registerWebhook({ linearClient, logger, url: webhookUrl })
    } catch (thrown) {
      const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
      logger.forBot().warn('Failed to register webhook:', errorMessage)
    }
  }
  logger.forBot().info('Integration registered successfully.')
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  try {
    const linearClient = await LinearOauthClient.create({ client, ctx })
    const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
    await unregisterWebhook({ linearClient, logger, url: webhookUrl })
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().warn('Failed to unregister webhook:', errorMessage)
  }
}
