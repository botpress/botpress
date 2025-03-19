import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, actions } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'bigcommerce',
  title: 'BigCommerce',
  version: '3.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Sync products from BigCommerce to Botpress',
  configuration,
  // Only exposing the syncProducts action in the UI for manual triggers
  actions: {
    syncProducts: actions.syncProducts,
  },
  states,
})
