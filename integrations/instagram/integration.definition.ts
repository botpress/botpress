import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export default new IntegrationDefinition({
  name: 'instagram',
  version: '1.0.0',
  title: 'Instagram',
  description: 'Automate interactions, manage comments, and send/receive messages all in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      appId: z.string().min(1).title('App ID').describe('The Meta App ID'),
      appSecret: z.string().min(1).title('App Secret').describe('The Meta App Secret'),
      verifyToken: z.string().min(1).title('Verify Token').describe('The token used to verify webhook requests'),
      pageId: z.string().min(1).title('Page ID').describe('The Facebook page ID linked to the Instagram account'),
      accessToken: z
        .string()
        .min(1)
        .title('Access Token')
        .describe('The access token of the Facebook page to your Meta App'),
      instagramBusinessAccountId: z
        .string()
        .min(1)
        .optional()
        .title('Instagram Business Account ID')
        .describe(
          'The Instagram Business Account ID of the Instagram profile connected to the Facebook page. Set this if it differs from the Facebook page ID.'
        ),
    }),
  },
  channels: {
    channel: {
      title: 'Direct Message',
      description: 'Direct message conversation between an Instagram user and the bot',
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'The Instagram message ID',
          },
          senderId: {
            title: 'Sender ID',
            description: 'The Instagram user ID of the message sender',
          },
          recipientId: {
            title: 'Recipient ID',
            description: 'The Instagram user ID of the message recipient',
          },
        },
      },
      conversation: {
        tags: {
          id: {
            title: 'Conversation ID',
            description: 'The Instagram user ID of the user in the conversation',
          },
        },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      id: {
        title: 'User ID',
        description: 'The Instagram user ID',
      },
    },
  },
  entities: {
    user: {
      title: 'User',
      description: 'An Instagram user',
      schema: z
        .object({
          id: z.string().title('ID').describe('The Instagram user ID'),
        })
        .title('User')
        .describe('The user object fields'),
    },
    dm: {
      title: 'Direct Message',
      description: 'An Instagram direct message conversation',
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Instagram user ID of the user in the conversation'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
    },
  },
})
  .extend(proactiveUser, ({ user }) => ({
    user,
  }))
  .extend(proactiveConversation, ({ dm }) => ({
    conversation: dm,
  }))
