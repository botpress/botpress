import { IntegrationDefinition, interfaces } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { events, states, actions, channels, user, configuration, entities } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Trello',
  version: '1.1.0',
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
  .extend(interfaces.listable, (entities) => ({ item: entities['card'] }))
  .extend(interfaces.readable, (entities) => ({ item: entities['card'] }))
  .extend(interfaces.updatable, (entities) => ({ item: entities['card'] }))
  .extend(interfaces.creatable, (entities) => ({ item: entities['card'] }))
  .extend(interfaces.deletable, (entities) => ({ item: entities['card'] }))

  .extend(interfaces.listable, (entities) => ({ item: entities['list'] }))
  .extend(interfaces.readable, (entities) => ({ item: entities['list'] }))

  .extend(interfaces.listable, (entities) => ({ item: entities['board'] }))
  .extend(interfaces.readable, (entities) => ({ item: entities['board'] }))

  .extend(interfaces.listable, (entities) => ({ item: entities['boardMember'] }))
  .extend(interfaces.readable, (entities) => ({ item: entities['boardMember'] }))

  .extend(interfaces.listable, (entities) => ({ item: entities['cardMember'] }))
  .extend(interfaces.readable, (entities) => ({ item: entities['cardMember'] }))
