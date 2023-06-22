import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, user, states } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'GitHub',
  version: '0.2.0',
  icon: 'icon.svg',
  readme: 'readme.md',
  description: 'Github integration for Botpress',
  configuration,
  actions,
  events,
  channels,
  user,
  states,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
