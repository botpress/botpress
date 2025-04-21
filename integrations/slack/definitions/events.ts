import * as sdk from '@botpress/sdk'

export const events = {
  reactionAdded: {
    title: 'Reaction Added',
    description: 'Triggered when a reaction is added to a message',
    schema: sdk.z.object({
      reaction: sdk.z.string().title('Reaction').describe('The reaction that was added'),
      userId: sdk.z.string().optional().title('User ID').describe('The ID of the user who added the reaction'),
      conversationId: sdk.z.string().optional().title('Conversation ID').describe('The ID of the conversation'),
      targets: sdk.z
        .object({
          dm: sdk.z.record(sdk.z.string()).optional().title('DMs').describe('The DMs targeted by the reaction'),
          channel: sdk.z
            .record(sdk.z.string())
            .optional()
            .title('Channels')
            .describe('The channels targeted by the reaction'),
          thread: sdk.z
            .record(sdk.z.string())
            .optional()
            .title('Threads')
            .describe('The threads targeted by the reaction'),
        })
        .title('Targets')
        .describe('The targets of the reaction'),
    }),
  },

  reactionRemoved: {
    title: 'Reaction Removed',
    description: 'Triggered when a reaction is removed from a message',
    schema: sdk.z.object({
      reaction: sdk.z.string().title('Reaction').describe('The reaction that was removed'),
      userId: sdk.z.string().optional().title('User ID').describe('The ID of the user who removed the reaction'),
      conversationId: sdk.z.string().optional().title('Conversation ID').describe('The ID of the conversation'),
      targets: sdk.z
        .object({
          dm: sdk.z.record(sdk.z.string()).optional(),
          channel: sdk.z.record(sdk.z.string()).optional(),
          thread: sdk.z.record(sdk.z.string()).optional(),
        })
        .title('Targets')
        .describe('The targets of the reaction'),
    }),
  },

  memberJoinedWorkspace: {
    title: 'Member Joined Workspace',
    description: 'Triggered when a member joins the workspace',
    schema: sdk.z.object({
      userId: sdk.z.string().title('Botpress ID').describe('The Botpress ID of the user who joined the workspace'),
      target: sdk.z
        .object({
          userId: sdk.z.string().title('Slack ID').describe('The Slack ID of the user who joined the workspace'),
          userName: sdk.z.string().title('Username').describe('The username of the user who joined the workspace'),
          userRealName: sdk.z
            .string()
            .title('Real name')
            .describe('The real name of the user who joined the workspace'),
          userDisplayName: sdk.z
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
    schema: sdk.z.object({
      botpressUserId: sdk.z
        .string()
        .title('Botpress user ID')
        .describe('The Botpress ID of the user who joined the channel'),
      botpressConversationId: sdk.z
        .string()
        .title('Botpress Channel ID')
        .describe('The Botpress ID of the channel the user joined'),
      inviterBotpressUserId: sdk.z
        .string()
        .optional()
        .title('Botpress Inviter User ID')
        .describe('The Botpress ID of the user who invited the new member'),
      targets: sdk.z
        .object({
          slackUserId: sdk.z
            .string()
            .title('Slack User ID')
            .describe('The Slack ID of the user who joined the channel'),
          slackChannelId: sdk.z
            .string()
            .title('Slack Channel ID')
            .describe('The Slack ID of the channel the user joined'),
          slackInviterId: sdk.z
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
    schema: sdk.z.object({
      botpressUserId: sdk.z
        .string()
        .title('Botpress user ID')
        .describe('The Botpress ID of the user who left the channel'),
      botpressConversationId: sdk.z
        .string()
        .title('Botpress Channel ID')
        .describe('The Botpress ID of the channel the user left'),
      targets: sdk.z
        .object({
          slackUserId: sdk.z.string().title('Slack User ID').describe('The Slack ID of the user who left the channel'),
          slackChannelId: sdk.z
            .string()
            .title('Slack Channel ID')
            .describe('The Slack ID of the channel the user left'),
        })
        .title('Targets')
        .describe('Slack IDs of the user and channel'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['events']
