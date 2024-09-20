import { ActionDefinition, z } from '@botpress/sdk'

type Channel = 'dm' | 'channel'

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: Channel
}

export const addReaction = {
  title: 'Add Reaction',
  description: 'Add a reaction to a message',
  input: {
    schema: z.object({
      name: z
        .string()
        .title('Reaction name')
        .describe('The name of the reaction to add, ex: thumbsup')
        .placeholder('thumbsup'),
      messageId: z.string().title('Message ID').describe('The ID of the message, ex: {{event.messageId}}'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDefinition

export const findTarget = {
  title: 'Find Target',
  description: 'Find a target in Slack (ex: a channel, a user to send a dm, etc)',
  input: {
    schema: z.object({
      query: z.string().min(2).title('Search Query').describe('What to search for, ex name of a channel, a user, etc.'),
      channel: z.enum(['dm', 'channel']).title('Channel Name').describe('Which channel to look into, ex: dm, channel'),
    }),
  },
  output: {
    schema: z.object({
      targets: z
        .array(
          z.object({
            displayName: z.string().title('Display Name').describe('The display name of the target'),
            tags: z.record(z.string()).title('Tags').describe('The tags of the target'),
            channel: z.enum(['dm', 'channel']).title('Channel type').describe('The type of channel of the target'),
          })
        )
        .title('Targets')
        .describe('The matching targets'),
    }),
  },
} as const satisfies ActionDefinition

export const retrieveMessage = {
  title: 'Retrieve Message',
  description: 'Retrieve a message from Slack',
  input: {
    schema: z.object({
      ts: z.string().title('Timestamp').describe('The timestamp of the message to retrieve'),
      channel: z.string().title('Channel').describe('The channel of the message to retrieve'),
    }),
  },
  output: {
    schema: z.object({
      type: z.string().title('Type').describe('The type of the message'),
      user: z.string().title('User').describe('The user who sent the message'),
      ts: z.string().title('Timestamp').describe('The timestamp of the message'),
      text: z.string().title('Text').describe('The text of the message'),
    }),
  },
} as const satisfies ActionDefinition

export const syncMembers = {
  title: 'Sync Members',
  description:
    'Sync Slack workspace members to Botpress users. This action keeps track of the last sync timestamp and will only sync updated members since the last sync.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({ syncedCount: z.number().title('Synced Count').describe('The number of members synced') }),
  },
} as const satisfies ActionDefinition

export const startDmConversation = {
  title: 'Start DM Conversation',
  description: 'Initiate a conversation with a user in a DM',
  input: {
    schema: z.object({
      slackUserId: z.string().title('User ID').describe('The ID of the user to initiate the conversation with'),
    }),
  },
  output: {
    schema: z.object({
      userId: z.string().title('User ID').describe('The ID of the user'),
      conversationId: z.string().title('Conversation ID').describe('The ID of the new conversation'),
    }),
  },
} as const satisfies ActionDefinition

export const updateChannelTopic = {
  title: 'Update Channel Topic',
  description: 'Update the topic of a channel',
  input: {
    schema: z.object({
      topic: z.string().title('New Topic').describe('The new topic of the channel'),
      channelId: z.string().title('Channel ID').describe('The channel id of the target channel'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDefinition
