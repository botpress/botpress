import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import github from './bp_modules/github'
import linear from './bp_modules/linear'
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
  // TODO: replace Telegram with Slack when available
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
