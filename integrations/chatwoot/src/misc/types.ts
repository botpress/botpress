import { z } from '@botpress/sdk'

export const chatwootEventTypeSchema = z.enum([
  'message_created',
  'message_updated',
  'conversation_created',
  'conversation_updated',
  'conversation_status_changed',
  'webwidget_triggered',
  'contact_created',
  'contact_updated',
])

export const chatwootSenderSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable(),
})

export const chatwootAgentSchema = z.object({
  id: z.number(),
})

export const chatwootConversationMetaSchema = z.object({
  assignee: z
    .object({
      id: z.number(),
    })
    .nullable(),
})

export const chatwootConversationSchema = z.object({
  id: z.number(),
  status: z.string().optional(),
  meta: chatwootConversationMetaSchema.optional(),
})

export const chatwootAttachmentSchema = z.object({
  file_type: z.string(),
  data_url: z.string().optional(),
  file_url: z.string().optional(),
  filename: z.string().optional(),
})

export const chatwootWebhookPayloadSchema = z.object({
  event: chatwootEventTypeSchema,
  id: z.number().optional(),
  status: z.string().optional(),
  content: z.string().nullable(),
  message_type: z.union([z.string(), z.number()]).optional(),
  sender: chatwootSenderSchema.optional(),
  conversation: chatwootConversationSchema.optional(),
  attachments: z.array(chatwootAttachmentSchema).optional(),
})

export const chatwootProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  accounts: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      role: z.string().optional(),
    })
  ),
})

export const chatwootMessageResponseSchema = z.object({
  id: z.number(),
})

export const chatwootContactSchema = z.object({
  id: z.number(),
})

export const chatwootContactSearchResponseSchema = z.object({
  payload: z.array(chatwootContactSchema),
})

export const chatwootContactCreateResponseSchema = z.object({
  payload: z.object({
    contact: chatwootContactSchema,
  }),
})

export const chatwootConversationResponseSchema = z.object({
  id: z.number(),
})

export const chatwootStatusToggleResponseSchema = z.object({
  payload: z
    .object({
      success: z.boolean(),
      current_status: z.string(),
      conversation_id: z.number(),
    })
    .optional(),
  success: z.boolean().optional(),
  current_status: z.string().optional(),
  conversation_id: z.number().optional(),
})

export const chatwootContactConversationsResponseSchema = z.object({
  payload: z.array(chatwootConversationSchema),
})

export type ChatwootEventType = z.infer<typeof chatwootEventTypeSchema>
export type ChatwootSender = z.infer<typeof chatwootSenderSchema>
export type ChatwootAgent = z.infer<typeof chatwootAgentSchema>
export type ChatwootConversation = z.infer<typeof chatwootConversationSchema>
export type ChatwootAttachment = z.infer<typeof chatwootAttachmentSchema>
export type ChatwootWebhookPayload = z.infer<typeof chatwootWebhookPayloadSchema>
export type ChatwootProfile = z.infer<typeof chatwootProfileSchema>
export type ChatwootMessageResponse = z.infer<typeof chatwootMessageResponseSchema>
export type ChatwootContact = z.infer<typeof chatwootContactSchema>
export type ChatwootContactSearchResponse = z.infer<typeof chatwootContactSearchResponseSchema>
export type ChatwootContactCreateResponse = z.infer<typeof chatwootContactCreateResponseSchema>
export type ChatwootConversationResponse = z.infer<typeof chatwootConversationResponseSchema>
export type ChatwootStatusToggleResponse = z.infer<typeof chatwootStatusToggleResponseSchema>
export type ChatwootContactConversationsResponse = z.infer<typeof chatwootContactConversationsResponseSchema>
export type ChatwootConversationMeta = z.infer<typeof chatwootConversationMetaSchema>
