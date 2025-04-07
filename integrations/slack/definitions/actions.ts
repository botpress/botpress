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
} as const satisfies sdk.IntegrationDefinitionProps['actions']
