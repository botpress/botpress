import { posthogHelper } from '@botpress/common'
import { IntegrationDefinition, z } from '@botpress/sdk'
import { actionDefinitions } from 'src/definitions/actions'

export const INTEGRATION_NAME = 'browser'
export const INTEGRATION_VERSION = '0.8.8'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Browser',
  version: INTEGRATION_VERSION,
  description:
    'Capture screenshots and retrieve web page content with metadata for automated browsing and data extraction.',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: actionDefinitions,
  configuration: {
    schema: z.object({
      crawlerHeaderValue: z
        .string()
        .min(1)
        .default('botpress')
        .describe('Value sent in the X-Botpress-Crawler header for Firecrawl scrape requests')
        .title('Crawler Header Value'),
    }),
  },
  secrets: {
    ...posthogHelper.COMMON_SECRET_NAMES,
    SCREENSHOT_API_KEY: {
      description: 'ScreenShot key',
    },
    FIRECRAWL_API_KEY: {
      description: 'FireCrawl key',
    },
    FIRECRAWL_CUSTOM_HEADERS: {
      description: 'Custom HTTP headers to include in Firecrawl scrape requests (JSON object)',
      optional: true,
    },
    LOGO_API_KEY: {
      description: 'Logo key',
    },
  },
  attributes: {
    category: 'Developer Tools',
    repo: 'botpress',
  },
})
