import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, configurations, channels, user, secrets, states } from './src/definitions'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'GitHub',
  version: '1.1.6',
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
  secrets: { ...secrets, ...posthogHelper.COMMON_SECRET_NAMES },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
