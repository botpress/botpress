import * as sdk from '@botpress/sdk'
import { actions, entities, configuration, configurations, identifier, events, secrets, states } from './definitions'

export const INTEGRATION_NAME = 'datadog'
export const INTEGRATION_VERSION = '1.0.0'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  description:
    'Integrate with Datadog to monitor metrics, create events, and manage your observability infrastructure.',
  title: 'Datadog',
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
