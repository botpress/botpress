import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, events, actions } from './definitions'

export default new IntegrationDefinition({
  name: 'grafana',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  events,
  actions,
})
