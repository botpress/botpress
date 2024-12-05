import { z } from '@botpress/sdk'

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
})

export type CreateConversationResponse = z.output<typeof CreateConversationResponseSchema>

export type FreshchatConfiguration = z.infer<typeof FreshchatConfigurationSchema>

export const FreshchatConfigurationSchema = z.object({
  topic_name: z.string().title('Topic name').describe('Name from the default topic that is going to be used for HITL'),
  token: z.string().title('Api Key').describe('API key from Freshchat'),
  domain: z
    .string()
    .title('Domain Name')
    .describe('Your Freshchat domain from the Freshchat chat URL (example: yourcompany-5b321a95b1dfee217185497)'),
})

//Freshchat API Schemas

export const FreshchatAvatarSchema = z.object({
  url: z.string().optional(),
})

export const FreshchatPropertySchema = z.object({
  name: z.string(),
  value: z.string().optional(),
})

export const FreshchatUserSchema = z.object({
  id: z.string().optional(), // Optional as it's auto-generated
  created_time: z.string().optional(),
  updated_time: z.string().optional(),
  avatar: FreshchatAvatarSchema.optional(), // Optional as it's not stated if mandatory
  email: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  login_status: z.boolean().optional(),
  org_contact_id: z.string().optional(),
  phone: z.string().optional(), // Optional as it's not stated if mandatory
  properties: z.array(FreshchatPropertySchema).optional(), // Optional as it's not stated if mandatory
  reference_id: z.string().optional(),
  restore_id: z.string().optional(),
})

export const FreshchatChannelSchema = z.object({
  id: z.string().uuid(),
  icon: z.object({}).optional(), // Adjust schema for `icon` if it contains specific properties
  updated_time: z.string().datetime(),
  enabled: z.boolean(),
  public: z.boolean(),
  name: z.string(),
  tags: z.array(z.string()), // Assuming `tags` is an array of strings
  welcome_message: z.object({
    message_parts: z.array(
      z.object({
        text: z.object({
          content: z.string(),
        }),
      })
    ),
    message_type: z.enum(['normal']), // Adjust if there are other valid message types
    restrictResponse: z.boolean(),
    botsPrivateNote: z.boolean(),
    isBotsInput: z.boolean(),
  }),
  source: z.literal('FRESHCHAT'), // Assuming "FRESHCHAT" is the only valid value
})

export const FreshchatAgentSchema = z.object({
  id: z.string().uuid().optional(),
  created_time: z.string().datetime().optional(),
  agent_capacity: z.number().optional(),
  agent_status: z
    .object({
      name: z.string(),
    })
    .optional(),
  availability_status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'AWAY', 'BUSY']).optional(),
  avatar: z
    .object({
      url: z.string().url(),
    })
    .optional(),
  biography: z.string().optional(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  freshid_group_ids: z.array(z.string().uuid()).optional(),
  freshid_uuid: z.string().optional(),
  groups: z.array(z.string().uuid()).optional(),
  is_deactivated: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
  last_name: z.string().optional(),
  license_type: z.enum(['fulltime', 'parttime', 'contract']).optional(),
  locale: z.string().optional(),
  login_status: z.boolean().optional(),
  org_contact_id: z.string().optional(),
  role_id: z.string().optional(),
  role_name: z.string().optional(),
  routing_type: z.enum(['INTELLIASSIGN', 'MANUAL']).optional(),
  skill_id: z.string().uuid().optional(),
  social_profiles: z
    .array(
      z.object({
        type: z.string(),
        id: z.string(),
      })
    )
    .optional(),
  timezone: z.string().optional(),
})

export const FreshchatConversationSchema = z.object({
  conversation_id: z.string().optional(),
  channel_id: z.string().optional(),
  user_id: z.string().optional(),
})
export type FreshchatConversation = z.infer<typeof FreshchatConversationSchema>

export type FreshchatUser = z.infer<typeof FreshchatUserSchema>
export type FreshchatAgent = z.infer<typeof FreshchatAgentSchema>
export type FreshchatChannel = z.infer<typeof FreshchatChannelSchema>

export type FreshchatMessage = {
  message_parts: {
    text: {
      content: string
    }
  }[]
  channel_id: string
  message_type: string
  actor_type: string
  actor_id: string
}

// Extended Botpress User/Conversation Schemas

export const UserSchema = z.object({ id: z.string() })
export const ConversationSchema = z.object({ id: z.string() })

// Event specific schema

export const MessageEventSchema = z.object({ text: z.string() })
