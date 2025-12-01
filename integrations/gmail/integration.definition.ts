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

export const INTEGRATION_NAME = 'gmail'

export default new sdk.IntegrationDefinition({
  name: 'gmail',
  version: '1.0.0',
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
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
