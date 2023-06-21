import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from './src/const'
import { actions, channels, events, configuration, user, states } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Linear',
  description: 'Linear integration for Botpress',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration,
  channels,
  user,
  actions,
  events,
  states,
  secrets: ['CLIENT_ID', 'CLIENT_SECRET', 'WEBHOOK_SIGNING_SECRET', ...sentryHelpers.COMMON_SECRET_NAMES],
})
