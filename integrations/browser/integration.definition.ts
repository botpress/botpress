import { posthogHelper } from '@botpress/common'
import { IntegrationDefinition } from '@botpress/sdk'
import { actionDefinitions } from 'src/definitions/actions'

export const INTEGRATION_NAME = 'browser'
export const INTEGRATION_VERSION = '0.8.3'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Browser',
  version: INTEGRATION_VERSION,
  description:
    'Capture screenshots and retrieve web page content with metadata for automated browsing and data extraction.',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: actionDefinitions,
  secrets: {
    ...posthogHelper.COMMON_SECRET_NAMES,
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
