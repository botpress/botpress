import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from './src/const'
import { configuration, states, user, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Trello',
  readme: 'hub.md',
  description:
    "Boost your chatbot's capabilities with Trello. Easily update cards, add comments, create new cards, and read board members from your chatbot",
  icon: 'icon.svg',
  configuration,
  user,
  actions,
  events: {},
  channels: {},
  states,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
