import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'messenger',
  version: '4.0.0',
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
    manual: {
      title: 'Manual Configuration',
      description: 'Configure by manually supplying the Meta app details',
      schema: z.object({
        clientId: z.string().title('Client ID').min(1).describe('Meta app client id'),
        clientSecret: z
          .string()
          .title('Client Secret')
          .optional()
          .describe('Meta App secret used for webhook signature check. Leave empty to disable signature check.'),
        verifyToken: z
          .string()
          .title('Verify Token')
          .min(1)
          .describe(
            'Token used for verification when subscribing to webhooks on the Meta app (enter a random string of your choice)'
          ),
        accessToken: z
          .string()
          .title('Access Token')
          .min(1)
          .describe('Access Token from a System Account that has permission to the Meta app'),
        pageId: z.string().min(1).describe('Id from the Facebook page').title('Page ID'),
      }),
    },
    sandbox: {
      title: 'Sandbox Configuration',
      description: 'Sandbox configuration, for testing purposes only',
      schema: z.object({}),
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
      description: 'The client ID of your Meta app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Meta app',
    },
    OAUTH_CONFIG_ID: {
      description: 'The OAuth configuration ID for the OAuth Meta app',
    },
    VERIFY_TOKEN: {
      description: 'The verify token for the Meta Webhooks subscription',
    },
    ACCESS_TOKEN: {
      description: 'Access token for internal Meta App',
    },
    SANDBOX_CLIENT_ID: {
      description: 'The client ID of the Sandbox Meta app',
    },
    SANDBOX_CLIENT_SECRET: {
      description: 'The client secret of the Sandbox Meta app',
    },
    SANDBOX_VERIFY_TOKEN: {
      description: 'The verify token for the Sandbox Meta App Webhooks subscription',
    },
    SANDBOX_ACCESS_TOKEN: {
      description: 'Access token for the Sandbox Meta App',
    },
    SANDBOX_PAGE_ID: {
      description: 'Page ID for the Sandbox Facebook page',
    },
  },
  user: {
    tags: { id: { title: 'User ID', description: 'The Messenger ID of the user' } },
  },
  entities: {
    user: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Messenger ID of the user'),
        })
        .title('User')
        .describe('The user object fields'),
      title: 'User',
      description: 'A Messenger user',
    },
    conversation: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Messenger ID of the user in the conversation'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
      title: 'Conversation',
      description: 'A conversation with a Messenger user',
    },
  },
})
  .extend(typingIndicator, () => ({ entities: {} }))
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
