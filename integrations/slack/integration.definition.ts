import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import {
  addReaction,
  channel,
  dm,
  findTarget,
  retrieveMessage,
  startDmConversation,
  syncMembers,
  thread,
  updateChannelTopic,
  userTags,
} from './src/definitions'

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'This integration allows your bot to interact with Slack.',
  version: '0.4.4',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    ui: {
      botName: {
        title: 'Bot Name (displayed as the sender in Slack conversations)',
      },
      botAvatarUrl: {
        title: "Bot Avatar URL (URL for the image used as the Slack bot's avatar)",
      },
    },
    schema: z.object({
      botToken: z.string().optional(), // TODO revert once the multiple configuration is available
      signingSecret: z.string().optional(), // TODO revert once the multiple configuration is available
      botAvatarUrl: z.string().url().optional(),
      botName: z.string().optional(),
    }),
  },
  states: {
    configuration: {
      type: 'integration',
      schema: z.object({
        botUserId: z.string().optional().title('Bot User ID').describe('The ID of the bot user'),
      }),
    },
    sync: {
      type: 'integration',
      schema: z.object({
        usersLastSyncTs: z
          .number()
          .optional()
          .title('Users Last Sync Timestamp')
          .describe('The timestamp of the last sync'),
      }),
    },
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().secret().title('OAuth token').describe('The Bot User OAuth Token'),
      }),
    },
  },
  channels: {
    channel,
    dm,
    thread,
  },
  actions: {
    addReaction,
    findTarget,
    retrieveMessage,
    syncMembers,
    startDmConversation,
    updateChannelTopic,
  },
  events: {
    reactionAdded: {
      title: 'Reaction Added',
      description: 'Triggered when a reaction is added to a message',
      schema: z.object({
        reaction: z.string().title('Reaction').describe('The reaction that was added'),
        userId: z.string().optional().title('User ID').describe('The ID of the user who added the reaction'),
        conversationId: z.string().optional().title('Conversation ID').describe('The ID of the conversation'),
        targets: z
          .object({
            dm: z.record(z.string()).optional().title('DMs').describe('The DMs targeted by the reaction'),
            channel: z
              .record(z.string())
              .optional()
              .title('Channels')
              .describe('The channels targeted by the reaction'),
            thread: z.record(z.string()).optional().title('Threads').describe('The threads targeted by the reaction'),
          })
          .title('Targets')
          .describe('The targets of the reaction'),
      }),
      ui: {},
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of your Slack OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Slack OAuth app.',
    },
    SIGNING_SECRET: {
      description: 'The signing secret of your Slack OAuth app used to verify requests signature.',
    },
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
  user: {
    tags: userTags,
    creation: { enabled: true, requiredTags: ['id'] },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
})
