import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  secrets: {
    SCRAPER_API_KEY: {
      description: 'Scaper API Key',
      optional: false,
    },
  },
  actions: {
    indexUrls: {
      title: 'Index URLs',
      description: 'Indexes URLs',
      input: {
        schema: z.object({
          // studio does not support string[] input
          pageUrls: z.string(),
        }),
      },
      output: {
        schema: z.object({
          // studio does not support string[] output
          fileIds: z.string(),
          scraperCreditCost: z.number(),
        }),
      },
    },
    fetchUrls: {
      title: 'Fetch URLs',
      description: 'Fetch URLs',
      input: {
        schema: z.object({
          rootUrl: z.string(),
        }),
      },
      output: {
        schema: z.object({
          urls: z.array(z.string()),
        }),
      },
    },
  },
})
