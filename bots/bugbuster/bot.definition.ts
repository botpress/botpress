import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import github from './bp_modules/github'
import slack from './bp_modules/slack'

export default new sdk.BotDefinition({
  states: {
    listeners: {
      type: 'bot',
      schema: sdk.z.object({
        conversationIds: sdk.z.array(sdk.z.string()),
      }),
    },
  },
  events: {
    syncIssuesRequest: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    fetchIssues: {
      type: 'syncIssuesRequest',
      payload: {},
      schedule: { cron: '0 0/6 * * *' }, // every 6 hours
    },
  },
})
  .add(github, {
    enabled: true,
    configurationType: 'manualPAT',
    configuration: {
      personalAccessToken: genenv.GITHUB_TOKEN,
      githubWebhookSecret: genenv.GITHUB_WEBHOOK_SECRET,
    },
  })
  .add(slack, {
    enabled: true,
    configuration: {},
  })
