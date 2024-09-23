import * as sdk from '@botpress/sdk'
import linear from '@botpresshub/linear/integration.definition'
import telegram from '@botpresshub/telegram/integration.definition'

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {
    issue: {
      type: 'bot',
      schema: sdk.z.object({
        nextToken: sdk.z.string().optional(),
        tableCreated: sdk.z.boolean(),
      }),
    },
  },
  events: {
    syncIssues: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    syncIssues: {
      type: 'syncIssues',
      payload: {},
      schedule: {
        cron: '* * * * *', // every minute
      },
    },
  },
})
  .add(linear, {})
  .add(telegram, {})
