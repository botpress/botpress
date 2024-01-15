import { IntegrationDefinition } from '@botpress/sdk'

import { INTEGRATION_NAME } from './src/const'
import { configuration, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  description: 'This integration allows your bot to interact with Google Calendar.',
  title: 'Google Calendar',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
