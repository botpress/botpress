import { IntegrationDefinition } from '@botpress/sdk'
import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, states } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'SalesForce LiveAgent',
  version: '0.0.5',
  icon: 'icon.svg',
  description: 'This integration allows your bot to interact with Salesforce LiveAgent.',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  actions,
  events,
  secrets: { 'POOLING_URL': { description: '', optional: false }, 'POOLING_SK': { description: '', optional: false } },
})
