import * as sdk from '@botpress/sdk'
import { textSchema } from './text-input-schema'

const messages = {
  ...sdk.messages.defaults,
  text: {
    schema: textSchema,
  },
  bloc: sdk.messages.markdownBloc,
} as const satisfies sdk.ChannelDefinition['messages']

const conversationTags = {
  id: {
    title: 'ID',
    description: 'The Slack ID of the conversation',
  },
  title: {
    title: 'Title',
    description: 'The title of the conversation',
  },
  channelOrigin: {
    title: 'Channel Origin',
    description: 'The origin of the conversation (channel, dm, or thread)',
  },
  replyLocation: {
    title: 'Reply Location',
    description: 'The location where the bot will reply to the message (channel, thread, or channelAndThread).',
  },
  originalMessageTs: {
    title: 'Original Message Timestamp',
    description: 'Timestamp of the first message (used for thread creation)',
  },
  thread: {
    title: 'Thread ID',
    description: 'The Slack thread timestamp',
  },
  botMentioned: {
    title: 'Bot Mentioned',
    description: 'Whether the bot was mentioned in this conversation (activates thread replies)',
  },
} as const satisfies Record<string, Required<sdk.TagDefinition>>

const threadConversationTags = {
  ...conversationTags,
  isBotReplyThread: {
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
      tags: threadConversationTags,
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
