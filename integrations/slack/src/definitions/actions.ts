import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

type Channel = 'dm' | 'channel'

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: Channel
}

const addReaction = {
  title: 'Add Reaction',
  description: 'Add a reaction to a message',
  input: {
    schema: z.object({
      name: z.string().describe('The name of the reaction to add'),
      messageId: z.string().describe('The ID of the message, ex: {{event.messageId}}'),
    }),
    ui: {
      name: {
        title: 'Reaction Name',
        examples: ['thumbsup', 'thumbsdown', 'heart', 'smile', 'laughing', 'confused', 'tada', 'party'],
      },
      messageId: {
        title: 'Message Id',
        examples: ['{{event.messageId}}'],
      },
    },
  },
  output: {
    schema: z.object({}),
  },
}

const findTarget = {
  title: 'Find Target',
  description: 'Find a target in Slack (ex: a channel, a user to send a dm, etc)',
  input: {
    schema: z.object({
      query: z.string().min(2).describe('What to search for, ex name of a channel, a user, etc.'),
      channel: z.enum(['dm', 'channel']).describe('Which channel to look into, ex: dm, channel'),
    }),
    ui: {
      query: {
        title: 'Search Query',
      },
      channel: {
        title: 'Channel Name',
      },
    },
  },
  output: {
    schema: z.object({
      targets: z.array(
        z.object({
          displayName: z.string(),
          tags: z.record(z.string()),
          channel: z.enum(['dm', 'channel']),
        })
      ),
    }),
  },
}

export const actions = {
  addReaction,
  findTarget,
} satisfies IntegrationDefinitionProps['actions']
