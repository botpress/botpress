import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { INTEGRATION_NAME } from './src/const'
import { actions, channels, events, configuration, user, states } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Webchat',
  version: '0.3.3',
  icon: 'icon.svg',
  description: 'Webchat integration for Botpress',
  readme: 'hub.md',
  configuration,
  channels,
  user,
  states,
  actions,
  events,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
