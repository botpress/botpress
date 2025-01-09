import * as sdk from '@botpress/sdk'
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
  version: '1.0.0',
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
})
