import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'line',
  version: '0.2.0',
  title: 'Line',
  description: 'This integration allows your bot to interact with Line.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      channelAccessToken: z.string(),
      channelSecret: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      tags: {
        messages: ['msgId'],
        conversations: ['usrId', 'destId'],
      },
      conversation: { creation: { enabled: true, requiredTags: ['usrId', 'destId'] } },
    },
  },
  tags: {
    users: ['usrId'],
  },
  actions: {},
  events: {},
  states: {
    conversation: {
      type: 'conversation',
      schema: z.object({
        replyToken: z.string(),
      }),
    },
  },
  user: { creation: { enabled: true, requiredTags: ['usrId'] } },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
