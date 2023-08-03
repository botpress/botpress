import { IntegrationDefinition } from '@botpress/sdk'
import { INTEGRATION_NAME } from './src/const'
import { actions } from './src/definitions/actions'
import { configuration } from './src/definitions/configuration'
import { states } from './src/definitions/states'
import { events } from './src/definitions/events'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Shopify',
  description: 'This integration allows your bot to interact with Shopify.',
  version: '0.0.1',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration,
  actions,
  states,
  events,
})
