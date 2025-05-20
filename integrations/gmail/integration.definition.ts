import * as sdk from '@botpress/sdk'
import {
  configuration,
  configurations,
  identifier,
  channels,
  user,
  states,
  actions,
  events,
  secrets,
} from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'gmail',
  version: '0.6.2',
  title: 'Gmail',
  description: "Send, receive, and manage emails directly within your bot's workflow.",
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  configurations,
  identifier,
  channels,
  user,
  actions,
  events,
  states,
  secrets,
})
