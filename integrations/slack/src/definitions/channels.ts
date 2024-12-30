import { messages as baseMessages, IntegrationDefinitionProps, TagDefinition } from '@botpress/sdk'
import { textSchema } from './schemas'

type ChannelDef = NonNullable<IntegrationDefinitionProps['channels']>[string]

const messages = {
  ...baseMessages.defaults,
  markdown: baseMessages.markdown,
  text: {
    schema: textSchema,
  },
}

const convoTags = {
  id: {
    title: 'ID',
    description: 'The Slack ID of the conversation',
  },
  title: {
    title: 'Title',
    description: 'The title of the conversation',
  },
} as const satisfies { [key: string]: Required<TagDefinition> }

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
} as const satisfies { [key: string]: Required<TagDefinition> }

export const channel = {
  title: 'Channel',
  description: 'A general channel',
  messages,
  message: { tags: messageTags },
  conversation: {
    tags: { ...convoTags },
  },
} satisfies ChannelDef

export const dm = {
  title: 'Direct Message',
  description: 'A direct message channel',
  messages,
  message: { tags: messageTags },
  conversation: {
    tags: { ...convoTags },
  },
} satisfies ChannelDef

export const thread = {
  title: 'Thread',
  description: 'A thread inside a channel',
  messages,
  message: { tags: messageTags },
  conversation: {
    tags: {
      ...convoTags,
      thread: {
        title: 'Thread ID',
        description: 'The Slack ID of the thread',
      },
    },
  },
} satisfies ChannelDef
