import * as sdk from '@botpress/sdk'

type Channel = 'dm' | 'channel'

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: Channel
}

export const actions = {
  addReaction: {
    title: 'Add Reaction',
    description: 'Add a reaction to a message',
    input: {
      schema: sdk.z.object({
        name: sdk.z
          .string()
          .title('Reaction name')
          .describe('The name of the reaction to add, ex: thumbsup')
          .placeholder('thumbsup'),
        messageId: sdk.z.string().title('Message ID').describe('The ID of the message, ex: {{event.messageId}}'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },

  findTarget: {
    title: 'Find Target',
    description: 'Find a target in Slack (ex: a channel, a user to send a dm, etc)',
    input: {
      schema: sdk.z.object({
        query: sdk.z
          .string()
          .min(2)
          .title('Search Query')
          .describe('What to search for, ex name of a channel, a user, etc.'),
        channel: sdk.z
          .enum(['dm', 'channel'])
          .title('Channel Name')
          .describe('Which channel to look into, ex: dm, channel'),
      }),
    },
    output: {
      schema: sdk.z.object({
        targets: sdk.z
          .array(
            sdk.z.object({
              displayName: sdk.z.string().title('Display Name').describe('The display name of the target'),
              tags: sdk.z.record(sdk.z.string()).title('Tags').describe('The tags of the target'),
              channel: sdk.z
                .enum(['dm', 'channel'])
                .title('Channel type')
                .describe('The type of channel of the target'),
            })
          )
          .title('Targets')
          .describe('The matching targets'),
      }),
    },
  },

  retrieveMessage: {
    title: 'Retrieve Message',
    description: 'Retrieve a message from Slack',
    input: {
      schema: sdk.z.object({
        ts: sdk.z.string().title('Timestamp').describe('The timestamp of the message to retrieve'),
        channel: sdk.z.string().title('Channel').describe('The channel of the message to retrieve'),
      }),
    },
    output: {
      schema: sdk.z.object({
        type: sdk.z.string().title('Type').describe('The type of the message'),
        user: sdk.z.string().title('User').describe('The user who sent the message'),
        ts: sdk.z.string().title('Timestamp').describe('The timestamp of the message'),
        text: sdk.z.string().title('Text').describe('The text of the message'),
      }),
    },
  },

  syncMembers: {
    title: 'Sync Members',
    description:
      'Sync Slack workspace members to Botpress users. This action keeps track of the last sync timestamp and will only sync updated members since the last sync.',
    input: {
      schema: sdk.z.object({}),
    },
    output: {
      schema: sdk.z.object({
        syncedCount: sdk.z.number().title('Synced Count').describe('The number of members synced'),
      }),
    },
  },

  startChannelConversation: {
    title: 'Start Channel Conversation',
    description: 'Initiate a conversation in a channel',
    input: {
      schema: sdk.z.object({
        channelName: sdk.z
          .string()
          .title('Channel Name')
          .describe(
            'The name of the channel you want the conversation to be created at. If not provided, a channel ID must be provided.'
          )
          .optional(),
        channelId: sdk.z
          .string()
          .title('Channel ID')
          .describe(
            'The ID of the channel you want the conversation to be created at. If not provided, a channel name must be provided.'
          )
          .optional(),
      }),
    },
    output: {
      schema: sdk.z.object({
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the new conversation'),
      }),
    },
  },

  startDmConversation: {
    title: 'Start DM Conversation',
    description: 'Initiate a conversation with a user in a DM',
    input: {
      schema: sdk.z.object({
        slackUserId: sdk.z.string().title('User ID').describe('The ID of the user to initiate the conversation with'),
      }),
    },
    output: {
      schema: sdk.z.object({
        userId: sdk.z.string().title('User ID').describe('The ID of the user'),
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the new conversation'),
      }),
    },
  },

  updateChannelTopic: {
    title: 'Update Channel Topic',
    description: 'Update the topic of a channel',
    input: {
      schema: sdk.z.object({
        topic: sdk.z.string().title('New Topic').describe('The new topic of the channel'),
        channelId: sdk.z.string().title('Channel ID').describe('The channel id of the target channel'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },

  getUserProfile: {
    title: 'Get User Profile',
    description: 'Get information about a user',
    input: {
      schema: sdk.z.object({
        userId: sdk.z.string().title('User ID').describe('The ID of the user to retrieve information about'),
      }),
    },
    output: {
      schema: sdk.z.object({
        firstName: sdk.z.string().optional().title('Firstname').describe('The first name of the user'),
        lastName: sdk.z.string().optional().title('Lastname').describe('The last name of the user'),
        email: sdk.z.string().optional().title('Email').describe('The email of the user'),
        displayName: sdk.z.string().optional().title('Display Name').describe('The display name of the user'),
      }),
    },
  },

  getChannelInfoPaginated: {
    title: 'Get Channel Info Paginated',
    description: 'Get information about a channel by name using pagination',
    input: {
      schema: sdk.z.object({
        channelName: sdk.z
          .string()
          .title('Channel Name')
          .describe('The name of the channel to retrieve information about'),
        nextToken: sdk.z
          .string()
          .title('Next Token')
          .describe('The pagination cursor token from the previous request. Use empty string for the first request.'),
      }),
    },
    output: {
      schema: sdk.z.object({
        found: sdk.z.boolean().title('Found').describe('Whether the channel was found'),
        id: sdk.z.string().optional().title('Channel ID').describe('The ID of the channel'),
        name: sdk.z.string().optional().title('Channel Name').describe('The name of the channel'),
        isPrivate: sdk.z.boolean().optional().title('Is Private').describe('Whether the channel is private'),
        isArchived: sdk.z.boolean().optional().title('Is Archived').describe('Whether the channel is archived'),
        topic: sdk.z.string().optional().title('Topic').describe('The topic of the channel'),
        purpose: sdk.z.string().optional().title('Purpose').describe('The purpose of the channel'),
        numMembers: sdk.z
          .number()
          .optional()
          .title('Number of Members')
          .describe('The number of members in the channel'),
        nextCursor: sdk.z
          .string()
          .optional()
          .title('Next Cursor')
          .describe('The cursor token for the next page of results. Use this for subsequent requests.'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
