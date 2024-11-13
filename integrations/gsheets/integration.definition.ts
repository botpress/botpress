import * as sdk from '@botpress/sdk'

import {
  actions,
  channels,
  configuration,
  configurations,
  events,
  identifier,
  secrets,
  states,
  user,
} from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'gsheets',
  version: '1.1.1',
  description: 'Access, update, and append Google Sheets data.',
  title: 'Google Sheets',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions,
  channels,
  configuration,
  configurations,
  events,
  identifier,
  secrets,
  states,
  user,
})
