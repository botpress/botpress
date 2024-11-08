/* bplint-disable */
import * as sdk from '@botpress/sdk'
import listable from './bp_modules/listable'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { events, states, actions, channels, user, configuration, entities } from './definitions'
import { integrationName } from './package.json'

export default new sdk.IntegrationDefinition({
  name: integrationName,
  title: 'Trello',
  version: '1.0.9',
  readme: 'hub.md',
  description:
    "Boost your chatbot's capabilities with Trello. Easily update cards, add comments, create new cards, and read board members from your chatbot",
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
}).extend(listable, (entities) => ({
  item: entities.card,
}))
