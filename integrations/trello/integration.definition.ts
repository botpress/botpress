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
  version: '1.1.2',
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
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.card },
    actions: { list: { name: 'cardList' } },
  }))
  .extend(readable, ({ entities }) => ({
    entities: { item: entities.card },
    actions: { read: { name: 'cardRead' } },
  }))
  .extend(creatable, ({ entities }) => ({
    entities: { item: entities.card },
    actions: { create: { name: 'cardCreate' } },
    events: { created: { name: 'cardCreated' } },
  }))
  .extend(updatable, ({ entities }) => ({
    entities: { item: entities.card },
    actions: { update: { name: 'cardUpdate' } },
    events: { updated: { name: 'cardUpdated' } },
  }))
  .extend(deletable, ({ entities }) => ({
    entities: { item: entities.card },
    actions: { delete: { name: 'cardDelete' } },
    events: { deleted: { name: 'cardDeleted' } },
  }))
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.list },
    actions: { list: { name: 'listList' } },
  }))
  .extend(readable, ({ entities }) => ({
    entities: { item: entities.list },
    actions: { read: { name: 'listRead' } },
  }))
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.board },
    actions: { list: { name: 'boardList' } },
  }))
  .extend(readable, ({ entities }) => ({
    entities: { item: entities.board },
    actions: { read: { name: 'boardRead' } },
  }))
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.boardMember },
    actions: { list: { name: 'boardMemberList' } },
  }))
  .extend(readable, ({ entities }) => ({
    entities: { item: entities.boardMember },
    actions: { read: { name: 'boardMemberRead' } },
  }))
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.cardMember },
    actions: { list: { name: 'cardMemberList' } },
  }))
  .extend(readable, ({ entities }) => ({
    entities: { item: entities.cardMember },
    actions: { read: { name: 'cardMemberRead' } },
  }))
