import * as bp from '.botpress'

const telegram = new bp.telegram.Telegram()
const gsheets = new bp.gsheets.Gsheets()

export const bot = new bp.Bot({
  integrations: {
    telegram,
    gsheets,
  },
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
