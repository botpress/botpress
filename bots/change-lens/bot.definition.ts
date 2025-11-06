import { BotDefinition } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'
import slack from 'bp_modules/slack'

export default new BotDefinition({
  states: { metaApiVersions: { type: 'bot', schema: sdk.z.object({ graphApiVersion: sdk.z.string() }) } },
  events: {
    customEvent: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    custom: {
      type: 'customEvent',
      schedule: { cron: '0 * * * *' },
      payload: sdk.z.object({}),
    },
  },
}).addIntegration(slack, {
  enabled: true,
  configurationType: null, // we can't use OAuth because another bot uses it
  configuration: {
    typingIndicatorEmoji: false,
    createReplyThread: {
      enabled: false,
      onlyOnBotMention: false,
    },
    botAvatarUrl: 'https://files.bpcontent.cloud/2025/06/16/20/20250616204038-BRUW6C2R.svg',
    botName: 'Change Lens',
  },
})
