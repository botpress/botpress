import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'

export const INTEGRATION_NAME = 'messenger'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '3.0.0',
  title: 'Messenger',
  description: 'Give your bot access to one of the world’s largest messaging platform.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
    schema: z.object({}),
  },
  configurations: {
    manualApp: {
      title: 'Manual Configuration',
      description: 'Manual Configuration, use your own Meta app (for advanced use cases only)',
      schema: z.object({
        verifyToken: z
          .string()
          .title('Verify Token')
          .min(1)
          .describe(
            'Token used for verification when subscribing to webhooks on the Meta app (type any random string)'
          ),
        accessToken: z
          .string()
          .title('Access Token')
          .min(1)
          .describe('Access Token from a System Account that has permission to the Meta app'),
        clientId: z.string().title('Client ID').min(1).describe('Meta app client id'),
        clientSecret: z
          .string()
          .title('Client Secret')
          .optional()
          .describe('Meta app secret used for webhook signature check'),
        pageId: z.string().min(1).describe('Id from the Facebook page').title('Page ID'),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    channel: {
      title: 'Messenger conversation',
      description: 'Channel for a Messenger conversation',
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: {
          id: { title: 'Message ID', description: 'The Messenger ID of the message' },
          recipientId: { title: 'Recipient ID', description: 'The Messenger ID of the recipient' },
          senderId: { title: 'Sender ID', description: 'The Messenger ID of the sender' },
        },
      },
      conversation: {
        tags: {
          id: { title: 'Conversation ID', description: 'The Messenger ID of the conversation' },
          recipientId: { title: 'Recipient ID', description: 'The Messenger ID of the recipient' },
          senderId: { title: 'Sender ID', description: 'The Messenger ID of the sender' },
        },
      },
    },
  },
  actions: {},
  events: {},
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().optional().title('Access token').describe('The access token obtained by OAuth'),
        pageToken: z
          .string()
          .optional()
          .title('Page token')
          .describe('The token used to authenticate API calls related to the page'),
        pageId: z.string().optional().title('Page ID').describe('The page ID'),
      }),
    },
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: {
      description: 'The client ID of your Meta app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Meta app.',
    },
    ACCESS_TOKEN: {
      description: 'Access token for internal Meta App',
    },
    VERIFY_TOKEN: {
      description: 'The verify token for the Meta Webhooks subscription, optional since its only useful for oAuth.',
      optional: true,
    },
  },
  user: {
    tags: { id: { title: 'User ID', description: 'The Messenger ID of the user' } },
  },
}).extend(typingIndicator, () => ({ entities: {} }))

export const getOAuthConfigId = () => {
  if (process.env.BP_WEBHOOK_URL?.includes('dev')) {
    return 505750508672935
  }

  return 506253762185261
}
