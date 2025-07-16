import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, actions } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'bigcommerce',
  title: 'BigCommerce',
  version: '3.1.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Sync products from BigCommerce to Botpress',
  configuration,
  actions: {
    syncProducts: actions.syncProducts,
  },
  states,
})
