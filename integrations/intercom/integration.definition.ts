/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
// import proactiveUser from 'bp_modules/proactive-user'
// import proactiveConversation from 'bp_modules/proactive-conversation'

export default new IntegrationDefinition({
  name: 'intercom',
  version: '1.0.2',
  title: 'Intercom',
  description: 'Engage with customers in realtime with personalized messaging.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      adminId: z.string().min(1).describe('The admin ID of the Bot'),
      accessToken: z.string().min(1).describe('The access token of the Intercom app'),
      clientSecret: z
        .string()
        .min(1)
        .secret()
        .optional()
        .describe('The client secret of the Intercom app, used for event signature validation'),
    }),
    // TODO: Uncomment this once the Intercom app is approved
    //   identifier: {
    //     linkTemplateScript: 'linkTemplate.vrl',
    //     required: true,
    //   },
    //   schema: z.object({
    //     adminId: z.string().min(1).describe('The admin ID of the Bot'),
    //   }),
    // },
    // configurations: {
    //   manual: {
    //     title: 'Manual Configuration',
    //     description: 'Manual configuration, use your own Intercom app (for advanced use cases only)',
    //     schema: z.object({
    //       adminId: z.string().min(1).describe('The admin ID of the Bot'),
    //       accessToken: z.string().min(1).describe('The access token of the Intercom app'),
    //       clientSecret: z
    //         .string()
    //         .min(1)
    //         .secret()
    //         .describe(
    //           'The client secret of the Intercom app. Required for event signature validation, even if not authenticated by OAuth'
    //         ),
    //     }),
    //   },
    // },
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
        creation: { enabled: true, requiredTags: ['id'] },
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
    creation: { enabled: true, requiredTags: ['id'] },
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().min(1).describe('The access token obtained from OAuth'),
      }),
    },
  },
  entities: {
    user: {
      title: 'User',
      description: 'An Intercom user',
      schema: z.object({
        id: z.string().title('ID').describe('The Intercom user ID'),
      }),
    },
    conversation: {
      title: 'Conversation',
      description: 'An Intercom conversation',
      schema: z.object({
        id: z.string().title('ID').describe('The Intercom conversation ID'),
      }),
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
