import { IntegrationDefinition } from '@botpress/sdk'
import { channels, configuration, events, user } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  title: 'Amazon Connect',
  description: 'Integrate your Botpress bot with Amazon Connect for voice and chat contact center capabilities',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  channels,
  user,
  events,
  actions: {},
  secrets: {
    accessKeyId: {
      optional: false,
    },
    secretAccessKey: {
      optional: false,
    },
  },
})
