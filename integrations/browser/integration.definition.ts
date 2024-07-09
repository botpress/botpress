import { IntegrationDefinition } from '@botpress/sdk'
import { actionDefinitions } from 'src/definitions/actions'

export default new IntegrationDefinition({
  name: 'browser',
  version: '0.0.1',
  description: 'Tools to interact with web pages',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: actionDefinitions,
  secrets: {
    SCREENSHOT_API_KEY: {},
    FIRECRAWL_API_KEY: {},
  },
})
