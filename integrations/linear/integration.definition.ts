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
  readme: 'hub.md',
  configuration,
  channels,
  identifier: {
    extractScript: 'extract.vrl',
  },
  user,
  actions,
  events,
  states,
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of your Linear OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Linear OAuth app.',
    },
    WEBHOOK_SIGNING_SECRET: {
      description: 'The signing secret of your Linear webhook.',
    },
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
})
