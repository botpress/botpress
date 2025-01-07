import * as sdk from '@botpress/sdk'
import creatable from './bp_modules/creatable'
import {
  actions,
  channels,
  configuration,
  configurations,
  entities,
  events,
  identifier,
  secrets,
  states,
  user,
} from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'todoist',
  title: 'Todoist',
  description: 'Create and modify tasks, post comments and more.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions,
  channels,
  configuration,
  configurations,
  entities,
  events,
  identifier,
  secrets,
  states,
  user,
}).extend(creatable, ({ task }) => ({ item: task }))
