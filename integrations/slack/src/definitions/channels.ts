import { messages as baseMessages, IntegrationDefinitionProps } from '@botpress/sdk'
import { textSchema } from './schemas'

type ChannelDef = NonNullable<IntegrationDefinitionProps['channels']>[string]

const messages = {
  ...baseMessages.defaults,
  text: {
    schema: textSchema,
  },
}

const convoTags = {
  id: {},
  title: {},
} as const

const messageTags = {
  ts: {},
  userId: {},
  channelId: {},
} as const

export const channel = {
  title: 'Channel',
  messages,
  message: { tags: messageTags },
  conversation: {
    tags: { ...convoTags },
    creation: { enabled: true, requiredTags: ['id'] },
  },
} satisfies ChannelDef

export const dm = {
  title: 'Direct Message',
  messages,
  message: { tags: messageTags },
  conversation: {
    tags: { ...convoTags },
    creation: { enabled: true, requiredTags: ['id'] },
  },
} satisfies ChannelDef

export const thread = {
  title: 'Thread',
  messages,
  message: { tags: messageTags },
  conversation: {
    tags: { ...convoTags, thread: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
} satisfies ChannelDef
