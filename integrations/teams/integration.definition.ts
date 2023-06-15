import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { configuration, channels, user, states } from './src/definitions'

export default new IntegrationDefinition({
  name: 'teams',
  version: '0.2.0',
  title: 'Microsoft Teams',
  description: 'This integration allows your bot to interact with Microsoft Teams.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration,
  channels,
  user,
  actions: {},
  events: {},
  states,
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
