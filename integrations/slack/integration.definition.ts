import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Slack',
  description: 'This integration allows your bot to interact with Slack.',
  version: '0.2.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  actions,
  events,
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of your Slack OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Slack OAuth app.',
    },
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
  user,
  identifier: {
    extractScript: 'extract.vrl',
  },
})
