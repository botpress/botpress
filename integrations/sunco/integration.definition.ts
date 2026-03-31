import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'
import { events } from './definitions'

export const INTEGRATION_NAME = 'sunco'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '2.0.1',
  title: 'Sunshine Conversations',
  description: 'Give your bot access to a powerful omnichannel messaging platform.',
  icon: 'icon.svg',
  readme: 'hub.md',
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        token: z
          .string()
          .optional()
          .title('Token')
          .describe('The bearer token obtained after completing the OAuth flow'),
        appId: z.string().optional().title('App ID').describe('The registered app ID'),
        subdomain: z
          .string()
          .optional()
          .title('Subdomain')
          .describe('The subdomain of the authenticated app if there is one'),
      }),
    },
    webhook: {
      type: 'integration',
      schema: z.object({
        id: z.string().title('ID').describe('The webhook ID'),
        secret: z.string().title('Secret').describe('The webhook secret'),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: false,
    },
    schema: z.object({}),
  },
  channels: {
    channel: {
      title: 'Sunshine Conversations Channel',
      description: 'Channel for a Sunshine conversation',
      messages: { ...messages.defaults, markdown: messages.markdown, bloc: messages.markdownBloc },
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'The Sunshine Conversations message ID',
          },
        },
      },
      conversation: {
        tags: {
          id: {
            title: 'Conversation ID',
            description: 'The Sunshine Conversations conversation ID',
          },
          origin: {
            title: 'Origin',
            description: 'The Sunshine Conversations conversation origin type',
          },
        },
      },
    },
  },
  actions: {},
  events,
  secrets: {
    CLIENT_ID: {
      description: 'Botpress SunCo OAuth Client ID',
    },
    CLIENT_SECRET: {
      description: 'Botpress SunCo OAuth Client Secret',
    },
    MARKETPLACE_BOT_NAME: {
      description: 'The name of the marketplace bot',
    },
    MARKETPLACE_ORG_ID: {
      description: 'The ID of the marketplace organization',
    },
    MARKETPLACE_BOT_ID: {
      description: 'The bot ID for the Zendesk marketplace',
    },
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
  user: {
    tags: {
      id: {
        title: 'User ID',
        description: 'The Sunshine Conversations user ID',
      },
    },
  },
  entities: {
    user: {
      title: 'User',
      description: 'A Sunshine Conversations user',
      schema: z
        .object({
          id: z.string().title('ID').describe('The Sunshine Conversations user ID'),
        })
        .title('User')
        .describe('The user object fields'),
    },
    conversation: {
      title: 'Conversation',
      description: 'A Sunshine Conversations conversation',
      schema: z
        .object({
          id: z.string().title('ID').describe('The Sunshine Conversations conversation ID'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
    },
  },
  attributes: {
    category: 'Communication & Channels',
    guideSlug: 'sunco',
    repo: 'botpress',
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
