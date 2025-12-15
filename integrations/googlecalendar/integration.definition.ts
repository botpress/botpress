import * as sdk from '@botpress/sdk'
import { actions, entities, configuration, configurations, identifier, events, secrets, states } from './definitions'

export const INTEGRATION_NAME = 'googlecalendar'
export const INTEGRATION_VERSION = '2.0.5'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  description: 'Sync with your calendar to manage events, appointments, and schedules directly within the chatbot.',
  title: 'Google Calendar',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  identifier,
  configurations,
  entities,
  actions,
  events,
  secrets,
  states,
})
