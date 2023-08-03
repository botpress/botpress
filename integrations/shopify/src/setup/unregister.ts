import axios from 'axios'
import type * as botpress from '.botpress'
import { ARR_OF_EVENTS, SHOPIFY_API_VERSION } from '../const'

type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type UnregisterFunction = Implementation['unregister']

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  axios.defaults.baseURL = `https://${ctx.configuration.shopName}.myshopify.com`
  axios.defaults.headers['X-Shopify-Access-Token'] = ctx.configuration.access_token
  axios.defaults.headers['Content-Type'] = 'application/json'

  const stateRes = await client.getState({
    id: `${ctx.integrationId}`,
    name: 'configuration',
    type: 'integration',
  })

  for (let i = 0; i < stateRes.length; i++) {
    await deleteWebhook(stateRes[i].webhookId, logger)
  }
}

async function deleteWebhook(webhookId: string, logger) {
  try {
    const response = await axios.delete(`/admin/api/${SHOPIFY_API_VERSION}/webhooks/${webhookId}.json`)

    logger.forBot().debug('data: ' + response.data)

    logger.forBot().info(`Shopify ${webhookId} Webhook Deleted ${response.data}`)
  } catch (e) {
    logger.forBot().error(`'Shopify ${webhookId} Webhook Deletion' exception ${JSON.stringify(e)}`)
  }
}
