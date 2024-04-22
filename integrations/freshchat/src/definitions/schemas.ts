import { z } from 'zod'

export const CreateConversationResponseSchema = z
  .object({
    conversation_id: z.string(),
    channel_id: z.string(),
  })

export type CreateConversationResponse = z.output<typeof CreateConversationResponseSchema>

export type FreshchatConfiguration = z.infer<typeof FreshchatConfigurationSchema>

export const FreshchatConfigurationSchema = z
.object({
  channel_id: z.string(),
  token: z.string(),
  domain: z.string()
})

//Freshchat API Schemas

export const FreshchatAvatarSchema = z.object({
  url: z.string().optional(),
})

export const FreshchatPropertySchema = z.object({
  name: z.string(),
  value: z.string(),
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

export const FreshchatConversationSchema = z.object({
  conversation_id: z.string().optional(),
  channel_id: z.string().optional(),
  user_id: z.string().optional()
})

export type FreshchatUser = z.infer<typeof FreshchatUserSchema>

// Extended Botpress User/Conversation Schemas

export const UserSchema = z.object({ id: z.string() })
export const UserWithFreshchatInfoSchema = UserSchema.merge(z.object({ freshchat: FreshchatUserSchema }))
export type UserWithFreshchatInfo = z.infer<typeof UserWithFreshchatInfoSchema>

export const ConversationSchema = z.object({ id: z.string() })
export const ConversationWithFreshchatInfoSchema = ConversationSchema.merge(z.object({ freshchat: FreshchatConversationSchema }))
export type ConversationWithFreshchatInfo = z.infer<typeof ConversationWithFreshchatInfoSchema>

// Event specific schema

export const MessageEventSchema = z.object({ text: z.string() })
