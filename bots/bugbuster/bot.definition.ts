import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import github from './bp_modules/github'
import slack from './bp_modules/slack'

export default new sdk.BotDefinition({
  states: {
    listeners: {
      type: 'bot',
      schema: sdk.z.object({
        conversationIds: sdk.z.array(sdk.z.string()).title('Conversation IDs').describe('List of conversation IDs'),
      }),
    },
  },
  events: {
    syncIssuesRequest: {
      schema: sdk.z.object({}).title('Sync Issues Request').describe('Request to sync issues'),
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
  .addIntegration(github, {
    enabled: true,
    configurationType: 'manualPAT',
    configuration: {
      personalAccessToken: genenv.BUGBUSTER_GITHUB_TOKEN,
      githubWebhookSecret: genenv.BUGBUSTER_GITHUB_WEBHOOK_SECRET,
    },
  })
  .addIntegration(slack, {
    enabled: true,
    configurationType: 'botToken',
    configuration: {
      botToken: genenv.BUGBUSTER_SLACK_BOT_TOKEN,
      signingSecret: genenv.BUGBUSTER_SLACK_SIGNING_SECRET,
      botName: 'BugBuster',
    },
  })
