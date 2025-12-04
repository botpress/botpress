import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export default new IntegrationDefinition({
  name: 'intercom',
  version: '2.0.1',
  title: 'Intercom',
  description: 'Engage with customers in realtime with personalized messaging.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accessToken: z.string().min(1).title('Access Token').describe('The access token of the Intercom app'),
      adminId: z.string().min(1).optional().title('Admin ID').describe('The admin ID of the Bot'),
      clientSecret: z
        .string()
        .min(1)
        .secret()
        .optional()
        .title('Client Secret')
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
      title: 'Intercom conversation',
      description: 'Channel for a Intercom conversation',
      messages: { ...messages.defaults, bloc: messages.markdownBloc },
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'The Intercom message ID',
          },
        },
      },
      conversation: {
        tags: {
          id: {
            title: 'Conversation ID',
            description: 'The Intercom conversation ID',
          },
        },
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
    tags: {
      id: {
        title: 'User ID',
        description: 'The Intercom user ID',
      },
      email: {
        title: 'User Email',
        description: 'The Intercom user email',
      },
    },
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        adminId: z.string().min(1).title('Admin ID').describe('The admin ID of the Bot'),
        accessToken: z.string().min(1).title('Access Token').describe('The access token obtained from OAuth'),
      }),
    },
  },
  entities: {
    user: {
      schema: z.object({
        id: z.string().min(1).title('User ID').describe('The ID of the Intercom user'),
      }),
    },
    conversation: {
      schema: z.object({
        id: z.string().min(1).title('Conversation ID').describe('The ID of the Intercom conversation'),
      }),
    },
  },
})
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
