import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, states, user, channels, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'jira',
  title: 'Jira',
  description: 'This integration allows you to manipulate Jira issues and users.',
  version: '0.3.0',
  readme: 'readme.md',
  icon: 'icon.svg',
  configuration,
  channels,
  user,
  actions,
  events: {},
  __advanced: {
    useLegacyZuiTransformer: true,
  },
  states,
})
