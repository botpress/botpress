import { z } from 'zod'
import * as botpress from '.botpress'

const telegram = new botpress.telegram.Telegram({
  enabled: true,
  config: {
    botToken: '6402478878:AAE-zzePKjgIl23G4VoP_S1StPaf4JoBzHU',
  },
})

const zendesk = new botpress.zendesk.Zendesk({
  enabled: true,
  config: {
    apiToken: '2ie7LaF0vpHCClxVdlpIsAXvWTk7RQT7dG4OiJlq',
    email: 'francois_levasseur@hotmail.com',
    organizationSubdomain: 'botpress6674',
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
