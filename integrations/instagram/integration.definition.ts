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
      appId: z.string().min(1),
      appSecret: z.string().min(1),
      verifyToken: z.string().min(1),
      pageId: z.string().min(1),
      accessToken: z.string().min(1),
      instagramBusinessAccountId: z
        .string()
        .min(1)
        .optional()
        .title('Instagram Business Account ID')
        .describe(
          'The Instagram Business Account ID of the Instagram profile connected to the Facebook page. Set this value if it is different from the Facebook page ID.'
        ),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: { tags: { id: {}, messageId: {}, senderId: {}, recipientId: {} } },
      conversation: {
        tags: { id: {} },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: { id: {} },
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
          id: z.string().title('User ID').describe('The Instagram user ID of the user taking part in the conversation'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
    },
  },
})
  .extend(proactiveUser, ({ user }) => {
    return {
      user,
    }
  })
  .extend(proactiveConversation, ({ dm }) => {
    return {
      conversation: dm,
    }
  })
