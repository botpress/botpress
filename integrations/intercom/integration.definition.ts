/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'intercom',
  version: '1.0.0',
  title: 'Intercom',
  description: 'Engage with customers in realtime with personalized messaging.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z
      .object({
        adminId: z.string().min(1),
        useManualConfiguration: z.boolean().optional().default(false),
        accessToken: z.string().min(1).optional(),
      })
      .hidden((formData) => {
        const hideManualConfig = !formData?.useManualConfiguration
        return {
          adminId: false,
          accessToken: hideManualConfig,
        }
      }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: {
          id: {},
        },
        //creation: { enabled: true, requiredTags: ['id'] }, // TODO: Required?
      },
    },
  },
  actions: {},
  events: {},
  identifier: {
    extractScript: 'extract.vrl',
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: { description: "The Client ID in your app's basic informations" },
    CLIENT_SECRET: { description: "The Client secret in your app's basic informations" },
  },
  user: {
    tags: { id: {}, email: {} },
    // creation: { enabled: true, requiredTags: ['id'] }, // TODO: Required?
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().min(1),
      }),
    },
  },
})
