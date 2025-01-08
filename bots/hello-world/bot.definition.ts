import * as sdk from '@botpress/sdk'
import * as env from './.genenv'
import logger from './bp_modules/logger'
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
  .addPlugin(logger, {
    configuration: {},
    interfaces: {},
  })
