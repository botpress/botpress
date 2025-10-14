import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, events } from './definitions'

export default new IntegrationDefinition({
  name: 'loops',
  title: 'Loops',
  description: 'Handle transactional emails from your chatbot.',
  version: '0.1.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  events,
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
