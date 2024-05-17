import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { actions, channels, events, configuration, user, states, entities } from './src/definitions'

export default new IntegrationDefinition({
  name: 'linear',
  version: '0.4.2',
  title: 'Linear',
  description:
    'Elevate project management with Linear. Update, create, and track issues effortlessly. Improve collaboration with workflow actions like marking duplicates, managing teams and connect your chatbot directly in discussions',
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
  entities,
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
