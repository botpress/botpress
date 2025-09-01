import * as sdk from '@botpress/sdk'
import * as env from './.genenv'
import chat from './bp_modules/chat'
import hubspot from './bp_modules/hubspot'
import telegram from './bp_modules/telegram'
import webhook from './bp_modules/webhook'

export default new sdk.BotDefinition({
  actions: {
    sayHello: {
      title: 'Say Hello',
      description: 'Says hello to the caller',
      input: {
        schema: sdk.z.object({ name: sdk.z.string().optional() }),
      },
      output: {
        schema: sdk.z.object({ message: sdk.z.string() }),
      },
    },
  },
})
  .addIntegration(telegram, {
    enabled: true,
    configuration: {
      botToken: env.HELLO_WORLD_TELEGRAM_BOT_TOKEN,
    },
  })
  .addIntegration(webhook, {
    enabled: true,
    configuration: {},
  })
  .addIntegration(hubspot, {
    enabled: true,
    configurationType: 'manual',
    configuration: {
      accessToken: '',
    },
  })
  .addIntegration(chat, {
    enabled: true,
    configuration: {},
  })
