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
       renderWaitTime: z
        .number()
        .min(0)
        .max(10_000)
        .optional()
        .default(0)
        .title('Render Wait Time')
        .describe('Defines the wait time in milliseconds for the page to render before fetching content. Adjust for pages with heavy or dynamic elements.'),
    }),
  },
  secrets: {
    SCREENSHOT_API_KEY: {},
    FIRECRAWL_API_KEY: {},
  },
})
