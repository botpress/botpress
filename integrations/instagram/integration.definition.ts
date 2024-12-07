/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

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
        verifyToken: z.string().optional().describe('Token used for verification for the Callback URL at API setup View'),
        accessToken: z
          .string()
          .optional()
          .describe('Access Token from the Instagram Account from the API setup View'),
        clientId: z.string().optional().describe('Instagram App Id from API setup View'),
        clientSecret: z.string().optional().describe('Instagram App secret from API setup View used for webhook signature check'),
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
      })
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
      messages: { ...messages.defaults, markdown: messages.markdown },
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
    }
  },
  user: {
    tags: { id: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
