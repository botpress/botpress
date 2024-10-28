import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const INTEGRATION_NAME = 'messenger'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '2.1.0',
  title: 'Messenger',
  description: 'This integration allows your bot to interact with Messenger.',
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
        verifyToken: z.string().min(1).describe('Token used for verification when subscribing to webhooks'),
        accessToken: z
          .string()
          .min(1)
          .describe('Access Token from a System Account that has permission to the Meta app'),
        clientId: z.string().optional(),
        clientSecret: z.string().optional().describe('Meta app secret used for webhook signature check'),
        pageId: z.string().min(1).describe('Id from the Facebook page'),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: {
        tags: { id: {}, recipientId: {}, senderId: {} },
      },
      conversation: {
        tags: { id: {}, recipientId: {}, senderId: {} },
      },
    },
  },
  actions: {},
  events: {},
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().optional(),
        pageToken: z.string().optional(),
        pageId: z.string().optional(),
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
  },
  user: {
    tags: { id: {} },
  },
})

export const getOAuthConfigId = () => {
  if (process.env.BP_WEBHOOK_URL?.includes('dev')) {
    return 505750508672935
  }

  return 506253762185261
}
