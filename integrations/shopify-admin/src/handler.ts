import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { fireOrderCancelled } from './events/order-cancelled'
import { fireOrderCreated } from './events/order-created'
import { fireOrderFulfilled } from './events/order-fulfilled'
import { fireOrderPaid } from './events/order-paid'
import { fireOrderUpdated } from './events/order-updated'
import { verifyWebhookHmac } from './oauth/hmac'
import { oauthWizardHandler } from './oauth/wizard'
import * as bp from '.botpress'

const SHOPIFY_TOPIC_HEADER = 'x-shopify-topic'
const SHOPIFY_HMAC_HEADER = 'x-shopify-hmac-sha256'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  if (oauthWizard.isOAuthWizardUrl(req.path)) {
    return await oauthWizardHandler(props)
  }

  // Webhook handling
  const topic = req.headers[SHOPIFY_TOPIC_HEADER]
  const hmac = req.headers[SHOPIFY_HMAC_HEADER]

  if (!topic || !hmac || !req.body) {
    logger.forBot().warn('Rejected Shopify webhook: missing required headers or body')
    return { status: 400, body: 'Missing Shopify webhook headers or body' }
  }

  if (!verifyWebhookHmac(req.body, hmac, bp.secrets.SHOPIFY_CLIENT_SECRET)) {
    logger.forBot().warn('Rejected Shopify webhook with invalid HMAC signature')
    return { status: 401, body: 'Invalid HMAC signature' }
  }

  const payload = JSON.parse(req.body)

  switch (topic) {
    case 'orders/create':
      return await fireOrderCreated({ payload, ...props })
    case 'orders/updated':
      return await fireOrderUpdated({ payload, ...props })
    case 'orders/cancelled':
      return await fireOrderCancelled({ payload, ...props })
    case 'orders/fulfilled':
      return await fireOrderFulfilled({ payload, ...props })
    case 'orders/paid':
      return await fireOrderPaid({ payload, ...props })
    case 'customers/data_request':
    case 'customers/redact':
    case 'shop/redact':
      // GDPR compliance webhooks. This integration does not persist Shopify customer data —
      // Admin API responses flow straight through to bot actions. Per-shop credentials
      // are cleared by unregister(); shop/redact (fired 48h after uninstall) is a safety-net no-op.
      // https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
      logger.forBot().info(`Received Shopify compliance webhook: ${topic}`)
      return { status: 200, body: '' }
    default:
      logger.forBot().warn(`Unhandled Shopify webhook topic: ${topic}`)
  }
}
