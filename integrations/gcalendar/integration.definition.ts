import { IntegrationDefinition } from '@botpress/sdk'

import { INTEGRATION_NAME } from './src/const'
import { configuration, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.1.0', // Change the version if needed
  description: 'This integration allows your bot to interact with Google Calendar.',
  title: 'Google Calendar', // Change the title
  readme: 'hub.md',
  icon: 'icon.svg', // Make sure you have the icon file in the correct path
  configuration,
  actions,
})
