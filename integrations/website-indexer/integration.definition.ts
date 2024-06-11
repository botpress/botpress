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
      schema: z.object({}),
    },
  },
  actions: {
    startPoll: {
      title: 'Start Poll',
      description: 'Starts the polling',
      input: {
        schema: z.object({
          conversationId: z.string(),
        }),
      },
      output: {
        schema: z.object({}),
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
        schema: z.object({}),
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
  },
})
