import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import gsheets from './bp_modules/gsheets'
import telegram from './bp_modules/telegram'

export default new sdk.BotDefinition({
  events: {},
  recurringEvents: {},
  conversation: {
    tags: {
      downstream: {
        title: 'Downstream Conversation ID',
        description: 'ID of the downstream conversation binded to the upstream one',
      },
      upstream: {
        title: 'Upstream Conversation ID',
        description: 'ID of the upstream conversation binded to the downstream one',
      },
    },
  },
})
  .addIntegration(gsheets, {
    enabled: true,
    configurationType: 'serviceAccountKey',
    configuration: {
      clientEmail: genenv.SHEETZY_GSHEETS_CLIENT_EMAIL,
      privateKey: genenv.SHEETZY_GSHEETS_PRIVATE_KEY,
      spreadsheetId: genenv.SHEETZY_GSHEETS_SPREADSHEET_ID,
    },
  })
  .addIntegration(telegram, {
    enabled: true,
    configuration: {
      botToken: genenv.SHEETZY_TELEGRAM_BOT_TOKEN,
    },
  })
