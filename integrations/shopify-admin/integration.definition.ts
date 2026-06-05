import { IntegrationDefinition } from '@botpress/sdk'
import { actions, events, states, configuration, secrets } from './definitions'

export default new IntegrationDefinition({
  name: 'shopify-admin',
  version: '0.1.2',
  title: 'Shopify Admin',
  description:
    'Connect your Shopify store via the Admin GraphQL API to manage products, customers, and orders via OAuth 2.0.',
  icon: 'icon.svg',
  readme: 'hub.md',
  identifier: {
    extractScript: 'extract.vrl',
  },
  configuration,
  actions,
  events,
  states,
  secrets,
})
