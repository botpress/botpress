import { IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { configuration, states, actions } from './src/definitions/index'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'BigCommerce',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  // Only exposing the syncProducts action in the UI for manual triggers
  actions: {
    syncProducts: actions.syncProducts
  },
  states,
})
