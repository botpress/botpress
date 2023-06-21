import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { targets } from './schemas'

const reactionAdded = {
  title: 'Reaction Added',
  description: 'Triggered when a reaction is added to a message',
  schema: z.object({
    reaction: z.string(),
    userId: z.string().optional(),
    conversationId: z.string().optional(),
    targets,
  }),
  ui: {},
}

export const events = {
  reactionAdded,
} satisfies IntegrationDefinitionProps['events']
