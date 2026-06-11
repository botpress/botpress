import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, events, actions } from './definitions'

export default new IntegrationDefinition({
  name: 'grafana',
  version: '0.1.1',
  title: 'Grafana',
  description: 'Interact with Grafana dashboards, alerts, folders, datasources, and notification policies',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  events,
  actions,
  attributes: {
    category: 'Developer Tools',
    repo: 'botpress',
  },
})
