import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { TriggerSchema } from './schemas'

const conversationStartedSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid(),
})

const conversationStarted = {
  schema: conversationStartedSchema,
  title: 'Conversation Started',
  description: 'Triggered when a new conversation is started',
  ui: {},
}

export type Trigger = z.infer<typeof trigger.schema>

export const trigger = {
  title: 'Trigger',
  description: "Triggered when a custom event is sent from the user's browser",
  schema: TriggerSchema,
  ui: {},
}

export const events = {
  conversationStarted,
  trigger,
} satisfies IntegrationDefinitionProps['events']
