import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, events, actions } from './definitions'
import { integrationName } from './package.json'


export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  events,
  actions,
})
