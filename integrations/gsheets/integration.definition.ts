import { IntegrationDefinition } from '@botpress/sdk'

import { INTEGRATION_NAME } from './src/const'
import { configuration, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.3.0',
  description: 'Seamlessly connect your Botpress chatbot with Google Sheets for easy data writing and retrieval',
  title: 'Google Sheets',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
