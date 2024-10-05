import * as sdk from '@botpress/sdk'
import gsheets from '@botpresshub/gsheets/integration.definition'
import telegram from '@botpresshub/telegram/integration.definition'

const gsheetsPkg = {
  type: 'integration',
  definition: gsheets,
} satisfies sdk.IntegrationPackage
const telegramPkg = {
  type: 'integration',
  definition: telegram,
} satisfies sdk.IntegrationPackage

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
  .add(gsheetsPkg, {
    enabled: true,
    configurationType: null,
    configuration: {
      clientEmail: '$CLIENT_EMAIL',
      privateKey: '$PRIVATE_KEY',
      spreadsheetId: '$SPREADSHEET_ID',
    },
  })
  .add(telegramPkg, {
    enabled: true,
    configurationType: null,
    configuration: {
      botToken: '$BOT_TOKEN',
    },
  })
