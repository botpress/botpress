import { IntegrationDefinition } from '@botpress/sdk'
import { INTEGRATION_NAME } from './src/const'
import { actions, configuration, channels } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Weavel',
  icon: 'icon.svg',
  readme: 'hub.md',
  description:
    'Get automatic insights into your users by integrating Weavel with Botpress. Weavel is a powerful analytics platform for conversational AI products that helps you understand your users better and make data-driven decisions.',
  configuration,
  actions,
  channels,
})
