import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, configurations, identifier, states, secrets, actions } from './definitions'

export const INTEGRATION_NAME = 'linkedin'
export const INTEGRATION_VERSION = '0.1.0'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'LinkedIn',
  description: 'Connect to LinkedIn to share posts and engage with your professional network.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  configurations,
  identifier,
  states,
  secrets,
  actions,
})
