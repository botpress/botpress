import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
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
        nextToken: sdk.z
          .string()
          .optional()
          .title('Next Page Token')
          .describe('Token to fetch the next page of issues'),
        tableCreated: sdk.z.boolean().title('Table Created').describe('Whether the table has been created'),
      }),
    },
  },
  events: {
    syncIssues: {
      schema: sdk.z.object({}).title('Sync Issues').describe('Sync issues from Linear to Airtable'),
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
  .addIntegration(linear, {
    enabled: true,
    configurationType: 'apiKey',
    configuration: {
      apiKey: genenv.SINLIN_LINEAR_API_KEY,
      webhookSigningSecret: genenv.SINLIN_LINEAR_WEBHOOK_SIGNING_SECRET,
    },
  })
  .addIntegration(telegram, {
    enabled: true,
    configuration: { botToken: genenv.SINLIN_TELEGRAM_BOT_TOKEN },
  })
