import * as sdk from '@botpress/sdk'
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
  .add(gsheets, {
    enabled: true,
    configuration: {
      clientEmail: '$CLIENT_EMAIL',
      privateKey: '$PRIVATE_KEY',
      spreadsheetId: '$SPREADSHEET_ID',
    },
  })
  .add(telegram, {
    enabled: true,
    configuration: {
      botToken: '$BOT_TOKEN',
    },
  })
