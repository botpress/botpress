import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import telegram from './bp_modules/telegram'
import zendesk from './bp_modules/zendesk'

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {
    flow: {
      type: 'conversation',
      schema: sdk.z.object({
        hitlEnabled: sdk.z.boolean().title('HITL Enabled').describe('Whether the bot is in HITL mode'),
      }),
    },
  },
  events: {},
  recurringEvents: {},
  user: {
    tags: {
      downstream: {
        title: 'Downstream User ID',
        description: 'ID of the downstream user binded to the upstream one',
      },
      upstream: {
        title: 'Upstream User ID',
        description: 'ID of the upstream user binded to the downstream one',
      },
    },
  },
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
  .add(telegram, {
    enabled: true,
    configuration: {
      botToken: genenv.HITLOOPER_TELEGRAM_BOT_TOKEN,
    },
  })
  .add(zendesk, {
    enabled: true,
    configuration: {
      apiToken: genenv.HITLOOPER_ZENDESK_API_TOKEN,
      email: genenv.HITLOOPER_ZENDESK_EMAIL,
      organizationSubdomain: genenv.HITLOOPER_ZENDESK_ORGANIZATION_SUBDOMAIN,
    },
  })
