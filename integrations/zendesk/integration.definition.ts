import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Zendesk',
  version: '0.2.0',
  icon: 'icon.svg',
  description:
    'Optimize your support workflow using Zendesk. Seamlessly integrate your chatbot into Zendesk chat, enabling you to trigger workflows from ticket updates. Easily manage tickets, access conversations, and engage with customers',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  user,
  actions,
  events,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
