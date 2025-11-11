import { IntegrationDefinition } from '@botpress/sdk'
import { actionDefinitions } from 'src/definitions/actions'

export default new IntegrationDefinition({
  name: 'browser',
  title: 'Browser',
  version: '0.8.1',
  description:
    'Capture screenshots and retrieve web page content with metadata for automated browsing and data extraction.',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: actionDefinitions,
  secrets: {
    SCREENSHOT_API_KEY: {
      description: 'ScreenShot key',
    },
    FIRECRAWL_API_KEY: {
      description: 'FireCrawl key',
    },
    LOGO_API_KEY: {
      description: 'Logo key',
    },
  },
})
