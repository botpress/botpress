import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'line',
  version: '2.0.0',
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
      messages: { ...messages.defaults },
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
  events: {
    followed: {
      title: 'Followed',
      description: 'The bot was followed by someone.',
      schema: z.object({
        destinationId: z.string().title('Destination ID').describe('The Line user ID of the bot'),
        userId: z.string().title('User ID').describe('The Line ID of the user'),
      }),
    },
  },
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
  entities: {
    user: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Line ID of the user'),
        })
        .title('User')
        .describe('The user object fields'),
      title: 'User',
      description: 'A Line user',
    },
    conversation: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Line ID of the user in the conversation'),
          destinationId: z.string().title('Destination ID').describe('Line user ID of the bot'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
      title: 'Conversation',
      description: 'A conversation with a Line user',
    },
  },
})
  .extend(typingIndicator, ({}) => ({ entities: {} }))
  .extend(proactiveUser, ({ entities }) => ({
    entities: {
      user: entities.user,
    },
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.conversation,
    },
  }))
