import { IntegrationDefinition } from '@botpress/sdk'
import { name } from './package.json'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name,
  icon: 'icon.svg',
  title: 'Zendesk',
  description: 'This integration allows your bot to interact with Zendesk.',
  readme: 'hub.md',
  version: '0.0.1',
  configuration,
  states,
  channels,
  user,
  actions,
  events,
})
