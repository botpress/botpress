import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'line',
  version: '1.0.0',
  title: 'Line',
  description: 'Interact with customers using a rich set of features.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      channelAccessToken: z.string().min(1),
      channelSecret: z.string().min(1),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: { msgId: {} },
      },
      conversation: {
        tags: { usrId: {}, destId: {} },
        creation: { enabled: true, requiredTags: ['usrId', 'destId'] },
      },
    },
  },
  actions: {},
  events: {},
  states: {
    conversation: {
      type: 'conversation',
      schema: z.object({
        replyToken: z.string().optional(),
      }),
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      usrId: {},
    },
    creation: { enabled: true, requiredTags: ['usrId'] },
  },
}).extend(typingIndicator, () => ({}))
