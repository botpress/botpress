/* bplint-disable */
import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { events, states, actions, channels, user, configuration } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Trello',
  version: '1.0.9',
  readme: 'hub.md',
  description: 'Update cards, add comments, create new cards, and read board members from your chatbot.',
  icon: 'icon.svg',
  actions,
  channels,
  user,
  configuration,
  states,
  events,
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
})
