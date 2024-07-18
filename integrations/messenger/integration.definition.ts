import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'messenger',
  version: '2.0.0',
  title: 'Messenger',
  description: 'This integration allows your bot to interact with Messenger.',
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
    schema: z.object({
      useManualConfiguration: z.boolean().optional().describe('Skip oAuth and supply details from a Meta App'),
      clientId: z.string(),
      clientSecret: z.string(),
      verifyToken: z.string(),
      pageId: z.string(),
      accessToken: z.string(),
    }),
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
        creation: { enabled: true, requiredTags: ['id'] },
      },
    },
  },
  actions: {},
  events: {},
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
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
    }
  },
  user: {
    tags: { id: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
