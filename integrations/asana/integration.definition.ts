import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { INTEGRATION_NAME } from './src/const'
import { configuration, states, user, channels, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.3.5',
  title: 'Asana',
  readme: 'hub.md',
  description:
    "Maximize productivity with Asana. Connect your bot to your Asana inbox, effortlessly create and update tasks, add comments, and locate users—all within your bot's workflow",
  icon: 'icon.svg',
  configuration,
  channels,
  user,
  actions,
  states,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
