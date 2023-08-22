import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, states, user, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'trello',
  version: '0.2.0',
  readme: 'readme.md',
  icon: 'icon.svg',
  configuration,
  user,
  actions,
  events: {},
  channels: {},
  states,
})
