import * as sdk from '@botpress/sdk'
import { actions, entities, configuration, configurations, identifier, events, secrets, states } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'googlecalendar',
  version: '2.0.1',
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
