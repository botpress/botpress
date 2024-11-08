import * as sdk from '@botpress/sdk'
import { configuration, identifier, channels, user, states, actions, events, secrets } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'gmail',
  version: '0.5.2',
  title: 'Gmail',
  description: 'This integration allows your bot to interact with Gmail.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  identifier,
  channels,
  user,
  actions,
  events,
  states,
  secrets,
})
