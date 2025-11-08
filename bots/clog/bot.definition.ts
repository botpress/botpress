import * as sdk from '@botpress/sdk'
import slack from 'bp_modules/slack'
import * as genenv from './.genenv'

export default new sdk.BotDefinition({
  states: {
    metaApiVersions: {
      type: 'bot',
      schema: sdk.z.object({
        currentGraphApiVersion: sdk.z.string().optional(),
      }),
    },
  },
  events: {
    timeToCheckApi: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    timeToCheckApi: {
      type: 'timeToCheckApi',
      schedule: { cron: '0 * * * *' },
      payload: sdk.z.object({}),
    },
  },
}).addIntegration(slack, {
  enabled: true,
  configurationType: 'refreshToken',
  configuration: {
    clientId: genenv.SLACK_CLIENT_ID,
    clientSecret: genenv.SLACK_CLIENT_SECRET,
    signingSecret: genenv.SLACK_SIGNING_SECRET,
    botToken: genenv.SLACK_REFRESH_TOKEN,
    refreshToken: genenv.SLACK_REFRESH_TOKEN,
    typingIndicatorEmoji: false,
    botName: 'Change Lens',
    botAvatarUrl: 'https://files.bpcontent.cloud/2025/06/16/20/20250616204038-BRUW6C2R.svg',
    createReplyThread: {
      enabled: false,
      onlyOnBotMention: false,
    },
  },
})
