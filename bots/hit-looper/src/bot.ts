import { z } from '@botpress/sdk'
import * as botpress from '.botpress'

const BOT_TOKEN = '6800892956:AAGjc0-oZZq2BTy9FpRq1E-9JMfRiwNcu4E'
const API_TOKEN = 'w7SufH95dbomRFe1e3tNoS0mOFcumNfFwwaIrjBJ'
const EMAIL = 'francois.levasseur@botpress.com'
const ORGANIZATION_SUBDOMAIN = 'botpress3163'

const telegram = new botpress.telegram.Telegram({
  enabled: true,
  config: {
    botToken: BOT_TOKEN,
  },
})

const zendesk = new botpress.zendesk.Zendesk({
  enabled: true,
  config: {
    apiToken: API_TOKEN,
    email: EMAIL,
    organizationSubdomain: ORGANIZATION_SUBDOMAIN,
  },
})

export const bot = new botpress.Bot({
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
