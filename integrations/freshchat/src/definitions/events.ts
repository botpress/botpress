import { z } from '@botpress/sdk'
import { MessageEventSchema } from './schemas'

const BasicEventSchema = z.object({
  freshchatConversationId: z.string(),
  botpressConversationId: z.string(),
  botpressUserId: z.string(),
})

const onAgentMessage = {
  title: 'Agent Message',
  description: 'Triggered when there is a Agent message',
  schema: z.object({
    message: MessageEventSchema,
  }).merge(BasicEventSchema),
  ui: {},
}

const onConversationResolution = {
  title: 'Conversation Resolution',
  description: 'Triggered when there is a Conversation Resolution',
  schema: BasicEventSchema,
  ui: {},
}

const onConversationAssignment = {
  title: 'Conversation Assignment',
  description: 'Triggered when there is a Conversation Assignment',
  schema: BasicEventSchema,
  ui: {},
}

export const events = {
  onConversationResolution,
  onConversationAssignment,
  onAgentMessage
}
