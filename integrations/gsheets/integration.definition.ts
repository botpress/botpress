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
  version: '0.3.5',
  description: 'Seamlessly connect your Botpress chatbot with Google Sheets for easy data writing and retrieval',
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
