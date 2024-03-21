import { z } from 'zod'
import * as botpress from '.botpress'

const telegram = new botpress.telegram.Telegram({
  enabled: true,
  config: {
    botToken: '111111111:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
})

const sfLiveAgent = new botpress.sfLiveAgent.SfLiveAgent({
  enabled: true,
  config: {
    endpoint: 'https://d.la2s-core1.sfdc-58ktaz.salesforceliveagent.com/chat',
    organizationId: '00DAq000001BRyn',
    deploymentId: '572Aq000000H5mT',
    buttonId: '5733h000000PSjZ',
    waitAgentTimeout: '10s',
    chatHistoryMessageCount: 10,
  },
})

export const bot = new botpress.Bot({
  integrations: {
    telegram,
    sfLiveAgent,
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
