import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'gsheets',
  version: '0.2.0',
  description: 'This integration allows your bot to interact with Google Sheets.',
  title: 'Google Sheets',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
