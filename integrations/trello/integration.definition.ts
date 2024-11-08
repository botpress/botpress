/* bplint-disable */
import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import creatable from './bp_modules/creatable'
import deletable from './bp_modules/deletable'
import listable from './bp_modules/listable'
import readable from './bp_modules/readable'
import updatable from './bp_modules/updatable'

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
})
  .extend(listable, (entities) => ({
    item: entities.card,
  }))
  .extend(readable, (entities) => ({
    item: entities.card,
  }))
  .extend(creatable, (entities) => ({
    item: entities.card,
  }))
  .extend(updatable, (entities) => ({
    item: entities.card,
  }))
  .extend(deletable, (entities) => ({
    item: entities.card,
  }))
  .extend(listable, (entities) => ({
    item: entities.list,
  }))
  .extend(readable, (entities) => ({
    item: entities.list,
  }))
  .extend(listable, (entities) => ({
    item: entities.board,
  }))
  .extend(readable, (entities) => ({
    item: entities.board,
  }))
  .extend(listable, (entities) => ({
    item: entities.boardMember,
  }))
  .extend(readable, (entities) => ({
    item: entities.boardMember,
  }))
  .extend(listable, (entities) => ({
    item: entities.cardMember,
  }))
  .extend(readable, (entities) => ({
    item: entities.cardMember,
  }))
