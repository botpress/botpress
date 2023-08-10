import { Client } from '@botpress/client'
import type { IntegrationContext, IntegrationProps } from '@botpress/sdk'
import axios from 'axios'
import { SHOPIFY_API_VERSION } from '../const'
import type * as botpress from '.botpress'
import type { Configuration } from '.botpress/implementation/configuration'

type IntegrationLogger = Parameters<IntegrationProps['handler']>[0]['logger']
type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type UnregisterFunction = Implementation['unregister']

export const unregister: UnregisterFunction = async ({
  client,
  ctx,
  logger,
}: {
  client: Client
  ctx: IntegrationContext<Configuration>
  logger: IntegrationLogger
}) => {
  const { state } = await client.getState({
    id: `${ctx.integrationId}`,
    name: 'configuration',
    type: 'integration',
  })

  for (const webhookId of state.payload.webhookIds ?? []) {
    await deleteWebhook(ctx, webhookId, logger)
  }
}

async function deleteWebhook(ctx, webhookId, logger) {
  try {
    const axiosConfig = {
      baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
      headers: {
        'X-Shopify-Access-Token': ctx.configuration.access_token,
        'Content-Type': 'application/json',
      },
    }

    const response = await axios.delete(`/admin/api/${SHOPIFY_API_VERSION}/webhooks/${webhookId}.json`, axiosConfig)

    logger.forBot().debug('data: ' + response.data)

    logger.forBot().info(`Shopify ${webhookId} Webhook Deleted ${response.data}`)
  } catch (e) {
    logger.forBot().error(`'Shopify ${webhookId} Webhook Deletion' exception ${JSON.stringify(e)}`)
  }
}
