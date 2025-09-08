import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, configuration } from './definitions'

export default new IntegrationDefinition({
  name: 'loops',
  title: 'Loops',
  description: 'Handle transactional emails from your chatbot.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
