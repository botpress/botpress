import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export const INTEGRATION_NAME = 'instagram'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '2.0.0',
  title: 'Instagram',
  description: 'Automate interactions, manage comments, and send/receive messages all in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    ui: {
      useManualConfiguration: {
        title: 'Use Manual Configuration',
      },
    },
    schema: z
      .object({
        useManualConfiguration: z.boolean().optional().describe('Skip oAuth and supply details from a Meta App'),
        verifyToken: z
          .string()
          .optional()
          .describe('Token used for verification for the Callback URL at API setup View'),
        accessToken: z.string().optional().describe('Access Token from the Instagram Account from the API setup View'),
        clientId: z.string().optional().describe('Instagram App Id from API setup View'),
        clientSecret: z
          .string()
          .optional()
          .describe('Instagram App secret from API setup View used for webhook signature check'),
        instagramId: z.string().optional().describe('Instagram Account Id from API setup View'),
      })
      .hidden((formData) => {
        const showConfig = !formData?.useManualConfiguration

        return {
          verifyToken: showConfig,
          accessToken: showConfig,
          clientId: showConfig,
          clientSecret: showConfig,
          instagramId: showConfig,
        }
      }),
  },
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().optional(),
        instagramId: z.string().optional(),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
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
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: {
      description: 'The client ID of your Meta app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Meta app.',
    },
  },
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
