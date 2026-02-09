import * as sdk from '@botpress/sdk'
import { channelTypeSchema, ChannelType } from './schemas/channel'
import { messagePayloadTypesSchema, messageSchema } from './schemas/messages'

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: ChannelType
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
              channel: channelTypeSchema.title('Channel Type').describe('The type of channel of the target'),
            })
          )
          .title('Targets')
          .describe('The matching targets'),
      }),
    },
  },

  addConversationContext: {
    title: 'Add Conversation Context',
    description: 'Add messages from a previous conversation as context to a target conversation',
    input: {
      schema: sdk.z.object({
        conversationId: sdk.z.string().title('Conversation ID').describe('The target conversation to add context to'),
        messages: sdk.z.array(messageSchema).title('Messages').describe('The messages to add as context'),
        channelOrigin: channelTypeSchema.title('Channel Type').describe('The type of channel the messages came from'),
      }),
    },
    output: {
      schema: sdk.z.object({
        conversationId: sdk.z
          .string()
          .title('Conversation ID')
          .describe('The conversation ID that received the context'),
      }),
    },
  },

  getConversationContextByConversationId: {
    title: 'Get Conversation Context by Conversation ID',
    description: 'Get the context of a conversation by its ID',
    input: {
      schema: sdk.z.object({
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the conversation'),
      }),
    },
    output: {
      schema: sdk.z.object({
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the conversation'),
        messages: sdk.z.array(messageSchema).title('Messages').describe('The messages in the conversation'),
      }),
    },
  },

  getConversationContextByTags: {
    title: 'Get Conversation Context by Tags',
    description: 'Get the context of a conversation',
    input: {
      schema: sdk.z.object({
        channel: channelTypeSchema.title('Channel').describe('The channel of the conversation'),
        channelId: sdk.z.string().title('Channel ID').describe('The ID of the channel'),
        thread: sdk.z.string().optional().title('Thread').describe('The thread of the conversation'),
      }),
    },
    output: {
      schema: sdk.z.object({
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the conversation'),
        channelId: sdk.z.string().title('Channel ID').describe('The ID of the channel'),
        thread: sdk.z.string().optional().title('Thread').describe('The thread of the conversation'),
        messages: sdk.z.array(messageSchema).title('Messages').describe('The messages in the conversation'),
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
        type: sdk.z.string().title('Type').describe('The type of the message'), // QUESTION: Should I be using my messagePayloadTypesSchema or just string?
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
          .describe('The name of the channel you want the conversation to be created at'),
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

  startThreadConversation: {
    title: 'Start Thread Conversation',
    description: 'Start a conversation in a thread',
    input: {
      schema: sdk.z.object({
        channelId: sdk.z.string().title('Channel ID').describe('The ID of the channel to start the conversation in'),
        threadTs: sdk.z
          .string()
          .title('Thread Timestamp')
          .describe('The timestamp of the thread to start the conversation in'),
      }),
    },
    output: {
      schema: sdk.z.object({
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
} as const satisfies sdk.IntegrationDefinitionProps['actions']
