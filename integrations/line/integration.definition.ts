import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'line',
  version: '1.0.1',
  title: 'Line',
  description: 'Interact with customers using a rich set of features.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      channelAccessToken: z
        .string()
        .min(1)
        .title('Channel Access Token')
        .describe('Token used to authenticate the bot with the Line API'),
      channelSecret: z
        .string()
        .min(1)
        .title('Channel Secret')
        .describe('Secret used to verify the signature of webhook events'),
    }),
  },
  channels: {
    channel: {
      title: 'Line conversation',
      description: 'Channel for a Line conversation',
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: {
          msgId: {
            title: 'Message ID',
            description: 'Line message ID',
          },
        },
      },
      conversation: {
        tags: {
          usrId: {
            title: 'User ID',
            description: 'Line user ID taking part in the conversation',
          },
          destId: {
            title: 'Destination ID',
            description: 'Line user ID of the bot',
          },
        },
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
        replyToken: z
          .string()
          .optional()
          .title('Reply Token')
          .describe('Token used to reply to a message received as a request on the webhook'),
      }),
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      usrId: {
        title: 'User ID',
        description: 'Line user ID',
      },
    },
    creation: { enabled: true, requiredTags: ['usrId'] },
  },
}).extend(typingIndicator, ({}) => ({ entities: {} }))
