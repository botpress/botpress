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

export const INTEGRATION_NAME = 'gsheets'
export const INTEGRATION_VERSION = '2.0.0'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
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
