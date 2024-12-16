/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import { actionDefinitions } from 'src/definitions/actions'

export default new IntegrationDefinition({
  name: 'browser',
  title: 'Browser',
  version: '0.3.0',
  description:
    'Capture screenshots and retrieve web page content with metadata for automated browsing and data extraction.',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: actionDefinitions,
  configuration: {
    schema: z.object({
      waitFor: z
        .number()
        .min(0)
        .max(10_000)
        .optional()
        .default(0)
        .describe('Wait x amount of milliseconds for the page to load to fetch content'),
    }),
  },
  secrets: {
    SCREENSHOT_API_KEY: {},
    FIRECRAWL_API_KEY: {},
  },
})
