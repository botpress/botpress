import * as sdk from '@botpress/sdk'
import slack from 'bp_modules/slack'

export default new sdk.BotDefinition({
  states: {
    metaApiVersions: {
      type: 'bot',
      schema: sdk.z.object({
        currentGraphApiVersion: sdk.z
          .string()
          .optional()
          .describe("The current Meta's Graph API version")
          .title('Current Graph API Version'),
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
  configuration: {
    typingIndicatorEmoji: false,
    botName: 'Clog',
    botAvatarUrl: 'https://files.bpcontent.cloud/2025/06/16/20/20250616204038-BRUW6C2R.svg',
    replyBehaviour: {
      location: 'channel',
      onlyOnBotMention: false,
    },
  },
})
