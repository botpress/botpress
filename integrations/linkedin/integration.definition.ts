import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, configurations, identifier, states, secrets, actions } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
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
