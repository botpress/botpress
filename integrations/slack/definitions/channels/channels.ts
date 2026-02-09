import * as sdk from '@botpress/sdk'
import { messagePayloadSchemas } from '../schemas/messages'

export const messages: sdk.ChannelDefinition['messages'] = {
  ...Object.fromEntries(Object.entries(messagePayloadSchemas).map(([key, schema]) => [key, { schema }])),
}

const conversationTags = {
  id: {
    title: 'ID',
    description: 'The Slack ID of the conversation',
  },
  mentionsBot: {
    title: 'Mentions Bot',
    description: 'Whether the bot was mentioned in this conversation (activates thread replies)',
  },
  title: {
    title: 'Title',
    description: 'The title of the conversation',
  },
} as const satisfies Record<string, Required<sdk.TagDefinition>>

const threadConversationTags = {
  thread: {
    title: 'Thread',
    description:
      'The Slack thread ID (is the thread_ts field from the Slack event of a thread message or the ts field from the Slack event of a channel message)',
  },
  isBotReplyThread: {
    // NOTE: Only kept for backwards compatibility with existing conversations
    title: 'Is Bot Reply Thread?',
    description: 'Whether the thread is a bot reply thread',
  },
} as const satisfies Record<string, Required<sdk.TagDefinition>>

const messageTags = {
  ts: {
    title: 'Timestamp',
    description: 'The timestamp of the message',
  },
  userId: {
    title: 'User ID',
    description: 'The Slack ID of the user who sent the message',
  },
  channelId: {
    title: 'Channel ID',
    description: 'The Slack ID of the channel where the message was sent',
  },
  mentionsBot: {
    title: 'Mentions Bot?',
    description: 'Whether the message mentions the Slack App bot',
  },
  channelOrigin: {
    title: 'Channel Origin',
    description: 'The type of channel the message was sent from (channel, dm, or thread)',
  },
  forkedToThread: {
    title: 'Forked to Thread',
    description: 'Whether the message was forked to a thread',
  },
} as const satisfies Record<string, Required<sdk.TagDefinition>>

export const channels = {
  channel: {
    title: 'Channel',
    description: 'A general channel',
    messages,
    message: { tags: messageTags },
    conversation: {
      tags: conversationTags,
    },
  },

  dm: {
    title: 'Direct Message',
    description: 'A direct message channel',
    messages,
    message: { tags: messageTags },
    conversation: {
      tags: conversationTags,
    },
  },

  thread: {
    title: 'Thread',
    description: 'A thread inside a channel',
    messages,
    message: { tags: messageTags },
    conversation: {
      tags: {
        ...conversationTags,
        ...threadConversationTags,
      },
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
