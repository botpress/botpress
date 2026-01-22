import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, actions, events, states } from './src/definitions'

export default new IntegrationDefinition({
  name: 'plus/google-sheets',
  version: '1.2.5',
  title: 'Google Sheets Public Sync',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  events,
  states,
})
