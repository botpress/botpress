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
  events: {
    pollCallback: {
      title: 'Poll Callback',
      description: 'Callback',
      schema: z.object({
        fileId: z.string(),
      }),
    },
  },
  actions: {
    startPoll: {
      title: 'Start Poll',
      description: 'Starts the polling',
      input: {
        schema: z.object({
          conversationId: z.string(),
          fileId: z.string(),
          delay: z.number(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    getFileStatus: {
      title: 'Get File Status',
      description: 'Gets the file status',
      input: {
        schema: z.object({
          fileId: z.string(),
        }),
      },
      output: {
        schema: z.object({
          status: z.string(),
        }),
      },
    },
    indexPage: {
      title: 'Index Page',
      description: 'Indexes a website page',
      input: {
        schema: z.object({
          pageUrl: z.string(),
        }),
      },
      output: {
        schema: z.object({
          fileId: z.string(),
        }),
      },
    },
    testCron: {
      title: 'Test Cron',
      description: 'Test the cron job',
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({}),
      },
    },

    searchFiles: {
      title: 'Search Files',
      description: 'Search files',
      input: {
        schema: z.object({
          minScore: z.string(),
          query: z.string(),
        }),
      },
      output: {
        schema: z.object({
          answer: z.string(),
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
