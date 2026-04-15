import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger }) => {
  // Storefront credentials (shop domain + storefront access token) are persisted by the OAuth
  // wizard (`src/oauth/wizard.ts`). No webhooks to subscribe — register is a no-op.
  logger.forBot().info('Shopify Storefront integration registered.')
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  // No external resources to clean up; Storefront credentials are cleared with the integration state.
  logger.forBot().info('Shopify Storefront integration unregistered.')
}
