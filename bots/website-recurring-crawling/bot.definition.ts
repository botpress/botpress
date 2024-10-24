import { BotDefinition, z } from '@botpress/sdk'

export default new BotDefinition({
  events: {
    // Defines an event that will trigger the recrawl of the website pages
    websiteCrawl: {
      schema: z.object({}),
    },
  },
  recurringEvents: {
    websiteCrawl: {
      payload: {},
      type: 'websiteCrawl', // Uses the event type defined above
      schedule: {
        cron: '0 0 * * *', // This will launch a crawl every day
      },
    },
  },
})
