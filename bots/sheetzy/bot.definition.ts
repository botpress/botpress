import * as sdk from '@botpress/sdk'
import gsheets from '@botpresshub/gsheets/integration.definition'
import telegram from '@botpresshub/telegram/integration.definition'

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
  .add(gsheets, {})
  .add(telegram, {})
