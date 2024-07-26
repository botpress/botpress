import { IntegrationDefinition, z } from '@botpress/sdk'
import { MAX_URLS } from 'src/constants'
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
          pageUrls: z.array(z.string()).min(1).max(MAX_URLS),
        }),
      },
      output: {
        schema: z.object({
          results: z.array(
            z.discriminatedUnion('status', [
              z.object({
                status: z.literal('success'),
                url: z.string(),
                fileId: z.string(),
                scraperCreditCost: z.number(),
              }),
              z.object({ status: z.literal('failed'), url: z.string(), failureReason: z.string() }),
            ])
          ),
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
