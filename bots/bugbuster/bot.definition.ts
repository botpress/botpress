import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import github from './bp_modules/github'
import linear from './bp_modules/linear'
import slack from './bp_modules/slack'
import telegram from './bp_modules/telegram'

export default new sdk.BotDefinition({
  states: {
    recentlyLinted: {
      type: 'bot',
      schema: sdk.z.object({
        issues: sdk.z
          .array(
            sdk.z.object({
              id: sdk.z.string(),
              lintedAt: sdk.z.string().datetime(),
            })
          )
          .title('Recently Linted Issues')
          .describe('List of recently linted issues'),
      }),
    },
    watchedTeams: {
      type: 'bot',
      schema: sdk.z.object({
        teamKeys: sdk.z
          .array(sdk.z.string())
          .title('Team Keys')
          .describe('The keys of the teams for which BugBuster should lint issues'),
      }),
    },
    lastLintedId: {
      type: 'workflow',
      schema: sdk.z.object({
        id: sdk.z.string().optional().title('ID').describe('The ID of the last successfully linted issue'),
      }),
    },
  },
  workflows: {
    lintAll: {
      input: { schema: sdk.z.object({}) },
      output: { schema: sdk.z.object({}) },
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
  .addIntegration(telegram, {
    enabled: true,
    configurationType: null,
    configuration: {
      botToken: genenv.BUGBUSTER_TELEGRAM_BOT_TOKEN,
    },
  })
  .addIntegration(linear, {
    enabled: true,
    configurationType: 'apiKey',
    configuration: {
      apiKey: genenv.BUGBUSTER_LINEAR_API_KEY,
      webhookSigningSecret: genenv.BUGBUSTER_LINEAR_WEBHOOK_SIGNING_SECRET,
    },
  })
  .addIntegration(slack, {
    enabled: true,
    configurationType: 'refreshToken',
    configuration: {
      refreshToken: genenv.BUGBUSTER_SLACK_REFRESH_TOKEN,
      clientId: genenv.BUGBUSTER_SLACK_CLIENT_ID,
      clientSecret: genenv.BUGBUSTER_SLACK_CLIENT_SECRET,
      signingSecret: genenv.BUGBUSTER_SLACK_SIGNING_SECRET,
      typingIndicatorEmoji: false,
    },
  })
