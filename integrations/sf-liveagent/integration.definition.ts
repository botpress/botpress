import { IntegrationDefinition } from '@botpress/sdk'
import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'SalesForce LiveAgent',
  version: '0.0.1',
  icon: 'icon.svg',
  description: 'This integration allows your bot to interact with Salesforce LiveAgent.',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  user,
  actions,
  events,
  secrets: { 'POOLING_URL': { description: '', optional: false }, 'POOLING_SK': { description: '', optional: false } },
})
