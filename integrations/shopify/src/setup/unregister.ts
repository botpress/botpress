import axios from 'axios'
import { SHOPIFY_API_VERSION } from '../const'
import type * as botpress from '.botpress'

type IntegrationLogger = Parameters<botpress.IntegrationProps['handler']>[0]['logger']
type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type UnregisterFunction = Implementation['unregister']
type IntegrationContext = Parameters<UnregisterFunction>[0]['ctx']

export const unregister: UnregisterFunction = async ({ ctx, logger, webhookUrl }) => {
  const axiosConfig = {
    baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
    headers: {
      'X-Shopify-Access-Token': ctx.configuration.access_token,
      'Content-Type': 'application/json',
    },
  }

  let response = await axios.get(`/admin/api/${SHOPIFY_API_VERSION}/webhooks.json?address=${webhookUrl}`, axiosConfig)

  if (response.data.webhooks.length > 0) {
    logger
      .forBot()
      .info(
        `Shopify "${
          response.data.webhooks.topic
        }" Webhook was found with id ${response.data.webhooks[0].id.toString()} for Bot ${
          ctx.botId
        }. Webhook was not created`
      )

    for (const webhook of response.data.webhooks) {
      const webhookId = webhook.id
      await deleteWebhook({ webhookId, ctx, logger })
    }
  }
}

async function deleteWebhook({
  webhookId,
  ctx,
  logger,
}: {
  webhookId: string
  ctx: IntegrationContext
  logger: IntegrationLogger
}) {
  try {
    const axiosConfig = {
      baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
      headers: {
        'X-Shopify-Access-Token': ctx.configuration.access_token,
        'Content-Type': 'application/json',
      },
    }

    const response = await axios.delete(`/admin/api/${SHOPIFY_API_VERSION}/webhooks/${webhookId}.json`, axiosConfig)

    logger.forBot().info(`Shopify ${webhookId} Webhook Deleted ${JSON.stringify(response.data)}`)
  } catch (e) {
    logger.forBot().error(`'Shopify ${webhookId} Webhook Deletion' exception ${JSON.stringify(e)}`)
  }
}
