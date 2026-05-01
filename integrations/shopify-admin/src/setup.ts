import { ShopifyClient } from './client'
import * as bp from '.botpress'

const WEBHOOK_TOPICS = ['ORDERS_CREATE', 'ORDERS_UPDATED', 'ORDERS_CANCELLED', 'ORDERS_FULFILLED', 'ORDERS_PAID']

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, webhookUrl, logger }) => {
  logger.forBot().info('Registering Shopify Admin integration...')

  let shopify: ShopifyClient
  try {
    shopify = await ShopifyClient.create({ client, ctx })
  } catch {
    logger
      .forBot()
      .info('No Shopify credentials yet — skipping webhook subscription. Complete the OAuth wizard to finish setup.')
    return
  }

  // Replace any previously-created subscriptions with a fresh set (e.g., after a re-auth).
  const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  for (const id of state.payload.webhookSubscriptionIds ?? []) {
    await shopify
      .unsubscribeWebhook(id)
      .catch((err) => logger.forBot().warn({ err }, `Failed to delete stale webhook subscription ${id}`))
  }

  const subscriptionIds: string[] = []
  for (const topic of WEBHOOK_TOPICS) {
    try {
      const id = await shopify.subscribeWebhook(topic, webhookUrl)
      if (id) {
        subscriptionIds.push(id)
      }
    } catch (err) {
      logger.forBot().warn({ err }, `Failed to subscribe to Shopify webhook topic ${topic}`)
    }
  }

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: { ...state.payload, webhookSubscriptionIds: subscriptionIds },
  })

  logger.forBot().info(`Shopify Admin integration registered with ${subscriptionIds.length} webhook subscription(s).`)
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  logger.forBot().info('Unregistering Shopify Admin integration...')

  let shopify: ShopifyClient
  try {
    shopify = await ShopifyClient.create({ client, ctx })
  } catch {
    logger.forBot().info('No Shopify credentials — nothing to unregister.')
    return
  }

  const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  for (const id of state.payload.webhookSubscriptionIds ?? []) {
    await shopify
      .unsubscribeWebhook(id)
      .catch((err) => logger.forBot().warn({ err }, `Failed to delete webhook subscription ${id}`))
  }

  logger.forBot().info('Shopify Admin integration unregistered.')
}
