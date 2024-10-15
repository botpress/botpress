import * as sdk from '@botpress/sdk'
import linear from './bp_modules/linear'
import telegram from './bp_modules/telegram'

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
  .add(linear, {
    enabled: true,
    configuration: {},
  })
  .add(telegram, {
    enabled: true,
    configuration: { botToken: '$BOT_TOKEN' },
  })
