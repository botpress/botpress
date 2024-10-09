import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const INTEGRATION_NAME = 'instagram'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '2.0.0',
  title: 'Instagram',
  description: 'This integration allows your bot to interact with Instagram.',
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
        verifyToken: z.string().optional().describe('Token used for verification when subscribing to webhooks'),
        accessToken: z
          .string()
          .optional()
          .describe('Access Token from a System Account that has permission to the Meta app'),
        clientId: z.string().optional(),
        clientSecret: z.string().optional().describe('Meta app secret used for webhook signature check'),
        pageId: z.string().optional().describe('Id from the Facebook page'),
      })
      .hidden((formData) => {
        const showConfig = !formData?.useManualConfiguration

        return {
          verifyToken: showConfig,
          accessToken: showConfig,
          clientId: showConfig,
          clientSecret: showConfig,
          pageId: showConfig,
        }
      })
  },
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
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: { tags: { id: {}, messageId: {}, senderId: {}, recipientId: {} } },
      conversation: {
        tags: { id: {}, recipientId: {}, senderId: {} },
        creation: { enabled: true, requiredTags: ['id'] },
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
    ACCESS_TOKEN: {
      description: 'Access token for internal Meta App',
    }
  },
  user: {
    tags: { id: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  }
})

export const getOAuthConfigId = () => {
  if (process.env.BP_WEBHOOK_URL?.includes('dev')) {
    return 1092427135645494
  }

  return 0
}
