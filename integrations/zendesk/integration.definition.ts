import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Zendesk',
  version: '0.2.0',
  icon: 'icon.svg',
  description: 'This integration allows your bot to interact with Zendesk.',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  user,
  actions,
  events,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
