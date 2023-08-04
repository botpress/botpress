import axios from 'axios'
import { SHOPIFY_API_VERSION } from '../const'
import type * as botpress from '.botpress'
import type { IntegrationContext } from '@botpress/sdk'
import type { Configuration } from '.botpress/implementation/configuration'

type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type UnregisterFunction = Implementation['unregister']

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  const stateRes = await client.getState({
    id: `${ctx.integrationId}`,
    name: 'configuration',
    type: 'integration',
  })

  for (let i = 0; i < stateRes.length; i++) {
    await deleteWebhook(ctx, stateRes[i].webhookId, logger)
  }
}

async function deleteWebhook(ctx: IntegrationContext<Configuration>, webhookId: string, logger) {
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
