import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { events, states, actions, channels, user, configuration, entities } from './definitions'

export const INTEGRATION_NAME = 'trello'
export const INTEGRATION_VERSION = '2.0.0'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Trello',
  version: INTEGRATION_VERSION,
  readme: 'hub.md',
  description: 'Update cards, add comments, create new cards, and read board members from your chatbot.',
  icon: 'icon.svg',
  actions,
  channels,
  user,
  configuration,
  states,
  events,
  entities,
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
})
