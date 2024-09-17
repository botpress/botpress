import { z } from '@botpress/sdk'
import * as bp from '.botpress'
import * as secrets from '.botpress/secrets'

const telegram = new bp.telegram.Telegram({
  enabled: true,
  config: {
    botToken: secrets.TELEGRAM_BOT_TOKEN,
  },
})
const zendesk = new bp.zendesk.Zendesk({
  enabled: true,
  config: {
    apiToken: secrets.ZENDESK_API_TOKEN,
    email: secrets.ZENDESK_EMAIL,
    organizationSubdomain: secrets.ZENDESK_ORGANIZATION_SUBDOMAIN,
  },
})

export const bot = new bp.Bot({
  integrations: {
    telegram,
    zendesk,
  },
  configuration: {
    schema: z.object({}),
  },
  states: {
    flow: {
      type: 'conversation',
      schema: z.object({
        hitlEnabled: z.boolean(),
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
