import * as sdk from '@botpress/sdk'
import creatable from './bp_modules/creatable'
import deletable from './bp_modules/deletable'
import listable from './bp_modules/listable'
import readable from './bp_modules/readable'
import updatable from './bp_modules/updatable'
import { actions, entities, configuration, configurations, identifier, events, secrets, states } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'googlecalendar',
  version: '1.0.1',
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
  .extend(listable, (entities) => ({
    item: entities.event,
  }))
  .extend(creatable, (entities) => ({
    item: entities.event,
  }))
  .extend(readable, (entities) => ({
    item: entities.event,
  }))
  .extend(updatable, (entities) => ({
    item: entities.event,
  }))
  .extend(deletable, (entities) => ({
    item: entities.event,
  }))
