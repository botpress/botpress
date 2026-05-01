import { IntegrationDefinition } from '@botpress/sdk'
import { actions, states, configuration, secrets } from './definitions'

export default new IntegrationDefinition({
  name: 'shopify-storefront',
  version: '0.1.0',
  title: 'Shopify Storefront',
  description:
    'Connect your Shopify store via the Storefront API to power buyer-facing product browsing, collections, and cart/checkout flows via OAuth 2.0.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  actions,
  states,
  secrets,
})
