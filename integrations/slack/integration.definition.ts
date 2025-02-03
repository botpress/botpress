import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'

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

const sharedConfig = {
  botAvatarUrl: z
    .string()
    .url()
    .optional()
    .title('Bot avatar URL')
    .describe("URL for the image used as the Slack bot's avatar"),
  botName: z.string().optional().title('Bot name').describe('Name displayed as the sender in Slack conversations'),
  typingIndicatorEmoji: z
    .boolean()
    .default(false)
    .title('Typing Indicator Emoji')
    .describe('Temporarily add an emoji to received messages to indicate when bot is processing message'),
}

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '1.1.1',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({ ...sharedConfig }),
  },
  configurations: {
    botToken: {
      title: 'Manual configuration',
      description: 'Configure by manually supplying the bot token and signing secret',
      schema: z.object({
        botToken: z
          .string()
          .secret()
          .title('Slack Bot User OAuth Token')
          .describe('Available in the app admin panel under OAuth & Permissions'),
        signingSecret: z
          .string()
          .secret()
          .title('Slack Signing Secret')
          .describe('Available in the app admin panel under Basic Info'),
        ...sharedConfig,
      }),
    },
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
        accessToken: z.string().secret().describe('The Bot User OAuth Token'),
        signingSecret: z.string().secret().describe('The Slack Signing Secret'),
      }),
    },
    tokenMetadata: {
      type: 'integration',
      schema: z.object({
        scopes: z.array(z.string()).title('Scopes').describe('The scopes granted to the token'),
        lastRefresh: z.string().datetime().title('Last Refresh').describe('The timestamp of the last token refresh'),
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
    },
    reactionRemoved: {
      title: 'Reaction Removed',
      description: 'Triggered when a reaction is removed from a message',
      schema: z.object({
        reaction: z.string().title('Reaction').describe('The reaction that was removed'),
        userId: z.string().optional().title('User ID').describe('The ID of the user who removed the reaction'),
        conversationId: z.string().optional().title('Conversation ID').describe('The ID of the conversation'),
        targets: z
          .object({
            dm: z.record(z.string()).optional(),
            channel: z.record(z.string()).optional(),
            thread: z.record(z.string()).optional(),
          })
          .title('Targets')
          .describe('The targets of the reaction'),
      }),
    },
    memberJoinedWorkspace: {
      title: 'Member Joined Workspace',
      description: 'Triggered when a member joins the workspace',
      schema: z.object({
        userId: z.string().title('Botpress ID').describe('The Botpress ID of the user who joined the workspace'),
        target: z
          .object({
            userId: z.string().title('Slack ID').describe('The Slack ID of the user who joined the workspace'),
            userName: z.string().title('Username').describe('The username of the user who joined the workspace'),
            userRealName: z.string().title('Real name').describe('The real name of the user who joined the workspace'),
            userDisplayName: z
              .string()
              .title('Display name')
              .describe('The display name of the user who joined the workspace'),
          })
          .title('Target')
          .describe('Slack user who joined the workspace'),
      }),
    },
    memberJoinedChannel: {
      title: 'Member Joined Channel',
      description: 'Triggered when a member joins a channel',
      schema: z.object({
        botpressUserId: z
          .string()
          .title('Botpress user ID')
          .describe('The Botpress ID of the user who joined the channel'),
        botpressConversationId: z
          .string()
          .title('Botpress Channel ID')
          .describe('The Botpress ID of the channel the user joined'),
        inviterBotpressUserId: z
          .string()
          .optional()
          .title('Botpress Inviter User ID')
          .describe('The Botpress ID of the user who invited the new member'),
        targets: z
          .object({
            slackUserId: z.string().title('Slack User ID').describe('The Slack ID of the user who joined the channel'),
            slackChannelId: z
              .string()
              .title('Slack Channel ID')
              .describe('The Slack ID of the channel the user joined'),
            slackInviterId: z
              .string()
              .optional()
              .title('Slack Inviter ID')
              .describe('The Slack ID of the user who invited the new member'),
          })
          .title('Targets')
          .describe('Slack IDs of the user, channel and inviter'),
      }),
    },
    memberLeftChannel: {
      title: 'Member Left Channel',
      description: 'Triggered when a member leaves a channel',
      schema: z.object({
        botpressUserId: z
          .string()
          .title('Botpress user ID')
          .describe('The Botpress ID of the user who left the channel'),
        botpressConversationId: z
          .string()
          .title('Botpress Channel ID')
          .describe('The Botpress ID of the channel the user left'),
        targets: z
          .object({
            slackUserId: z.string().title('Slack User ID').describe('The Slack ID of the user who left the channel'),
            slackChannelId: z.string().title('Slack Channel ID').describe('The Slack ID of the channel the user left'),
          })
          .title('Targets')
          .describe('Slack IDs of the user and channel'),
      }),
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
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
}).extend(typingIndicator, () => ({
  entities: {},
}))
