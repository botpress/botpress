import { z } from '@botpress/sdk'

export const CreateConversationResponseSchema = z
  .object({
    conversation_id: z.string(),
    channel_id: z.string(),
  })

export type CreateConversationResponse = z.output<typeof CreateConversationResponseSchema>

export type FreshchatConfiguration = z.infer<typeof FreshchatConfigurationSchema>

export const FreshchatConfigurationSchema = z
.object({
  channel_id: z.string().describe('Internal uuid (36 chars) from the Topic of the Webchat channel'),
  token: z.string().describe('API key from Freshchat, get at https://YOUR_COMPANY.freshworks.com/crm/sales/personal-settings/api-settings'),
  domain: z.string().describe('Your Freshchat domain from the chat URL, get at https://YOUR_COMPANY.freshworks.com/crm/sales/personal-settings/api-settings (example: botpress-5b321a95b1dfee217185497)')
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

export const FreshchatAgentSchema = z.object({
  id: z.string().uuid().optional(),
  created_time: z.string().datetime().optional(),
  agent_capacity: z.number().optional(),
  agent_status: z.object({
    name: z.string()
  }).optional(),
  availability_status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'AWAY', 'BUSY']).optional(),
  avatar: z.object({
    url: z.string().url()
  }).optional(),
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
  social_profiles: z.array(z.object({
    type: z.string(),
    id: z.string()
  })).optional(),
  timezone: z.string().optional()
});

export const FreshchatConversationSchema = z.object({
  conversation_id: z.string().optional(),
  channel_id: z.string().optional(),
  user_id: z.string().optional()
})
export type FreshchatConversation = z.infer<typeof FreshchatConversationSchema>


export type FreshchatUser = z.infer<typeof FreshchatUserSchema>
export type FreshchatAgent =  z.infer<typeof FreshchatAgentSchema>


// Extended Botpress User/Conversation Schemas

export const UserSchema = z.object({ id: z.string() })
export const ConversationSchema = z.object({ id: z.string() })

// Event specific schema

export const MessageEventSchema = z.object({ text: z.string() })
