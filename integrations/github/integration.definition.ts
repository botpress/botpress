/* bplint-disable */
import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, configurations, channels, user, secrets, states } from './src/definitions'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'GitHub',
  version: '1.1.5',
  icon: 'icon.svg',
  readme: 'hub.md',
  description: 'Manage GitHub issues, pull requests, and repositories.',
  configuration,
  configurations,
  actions,
  events,
  channels,
  user,
  states,
  identifier: {
    extractScript: 'extract.vrl',
  },
  secrets: { ...secrets, ...sentryHelpers.COMMON_SECRET_NAMES },
})
