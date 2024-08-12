import { ActionDefinition } from 'src/schemas'
import { z } from '@botpress/sdk'
import {
  FreshchatConversationSchema
} from './schemas'

const updateConversation: ActionDefinition = {
  title: 'Update Freshchat Conversation',
  description: 'Updates Freshchat Conversation',
  input: {
    schema: z.object({
      freshchatConversationId: z.string(),
      status: z.string().default('new').placeholder('status ex: new').title('Conversation Status (new,assigned,resolved,reopened)').describe('New Conversation Status'),
      assignedGroupId: z.string().optional(),
      assignedAgentId: z.string().optional(),
      channelId: z.string().optional(),
      properties: z.string().default('{}').optional()
    }),
  },
  output: {
    schema: z.object({ success: z.boolean(), message: z.string().optional(), data: FreshchatConversationSchema.optional() })
  },
}

export const actions = {
  updateConversation,
}

