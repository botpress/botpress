import * as bp from '.botpress'
import axios, { AxiosInstance } from 'axios'
import { RuntimeError } from '@botpress/sdk'
import {
  ChatwootMessageResponse,
  ChatwootProfile,
  ChatwootContactSearchResponse,
  ChatwootContactCreateResponse,
  ChatwootConversationResponse,
  ChatwootStatusToggleResponse,
  ChatwootConversation,
  ChatwootAgent,
  chatwootProfileSchema,
  chatwootMessageResponseSchema,
  chatwootContactSearchResponseSchema,
  chatwootContactCreateResponseSchema,
  chatwootConversationResponseSchema,
  chatwootStatusToggleResponseSchema,
  chatwootAgentSchema,
  chatwootConversationSchema,
} from './misc/types'
import FormData from 'form-data'

const chatwootClient = (apiAccessToken: string): AxiosInstance => {
  return axios.create({
    baseURL: 'https://app.chatwoot.com/api/v1',
    headers: { api_access_token: apiAccessToken },
  })
}

export const getApiAccessToken = (ctx: bp.Context) => {
  const apiAccessToken = ctx.configuration.apiAccessToken
  if (!apiAccessToken) {
    throw new RuntimeError('API access token is required')
  }
  return apiAccessToken
}

export const getProfile = async (apiAccessToken: string): Promise<ChatwootProfile> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.get(`/profile`)
    return chatwootProfileSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(`Failed to get profile: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const sendMessage = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string,
  content: string,
  messageType: 'incoming' | 'outgoing'
): Promise<ChatwootMessageResponse['id']> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.post(`/accounts/${accountId}/conversations/${conversationId}/messages`, {
      content,
      message_type: messageType,
      private: false,
    })
    return chatwootMessageResponseSchema.parse(response.data).id
  } catch (error) {
    throw new RuntimeError(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const sendAttachment = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<ChatwootMessageResponse['id']> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const formData = new FormData()
    formData.append('attachments[]', fileBuffer, fileName)
    const response = await client.post(`/accounts/${accountId}/conversations/${conversationId}/messages`, formData, {
      headers: { ...formData.getHeaders() },
    })
    return chatwootMessageResponseSchema.parse(response.data).id
  } catch (error) {
    throw new RuntimeError(`Failed to send attachment: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const searchContactByEmail = async (
  apiAccessToken: string,
  accountId: string,
  email: string
): Promise<ChatwootContactSearchResponse> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.get(`/accounts/${accountId}/contacts/search`, { params: { q: email } })
    return chatwootContactSearchResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(
      `Failed to search contact by email: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const createContact = async (
  apiAccessToken: string,
  accountId: string,
  email: string,
  inboxId: string
): Promise<ChatwootContactCreateResponse> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.post(`/accounts/${accountId}/contacts`, {
      email: email,
      name: email,
      inbox_id: inboxId,
    })
    return chatwootContactCreateResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(`Failed to create contact: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const createConversation = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string,
  inboxId: string
): Promise<ChatwootConversationResponse> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.post(`/accounts/${accountId}/conversations`, {
      contact_id: contactId,
      inbox_id: inboxId,
    })
    return chatwootConversationResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const resolveConversation = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string
): Promise<ChatwootStatusToggleResponse> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.post(`/accounts/${accountId}/conversations/${conversationId}/toggle_status`, {
      status: 'resolved',
    })
    return chatwootStatusToggleResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(`Failed to resolve conversation: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const getContactConversations = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string
): Promise<ChatwootConversation[]> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.get(`/accounts/${accountId}/contacts/${contactId}/conversations`)
    return chatwootConversationSchema.array().parse(response.data.payload ?? [])
  } catch (error) {
    throw new RuntimeError(
      `Failed to get contact conversations: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const assignConversation = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string,
  assigneeId: string
): Promise<ChatwootAgent> => {
  try {
    const client = chatwootClient(apiAccessToken)
    const response = await client.post(`/accounts/${accountId}/conversations/${conversationId}/assignments`, {
      assignee_id: assigneeId,
    })
    return chatwootAgentSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(`Failed to assign conversation: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const getPreviousAgentId = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string
): Promise<number | null> => {
  const conversations = await getContactConversations(apiAccessToken, accountId, contactId)

  const withAssignee = conversations.filter((c) => c.meta?.assignee?.id).sort((a, b) => b.id - a.id)

  return withAssignee[0]?.meta?.assignee?.id || null
}

export const getActiveConversation = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string
): Promise<ChatwootConversation | null> => {
  const conversations = await getContactConversations(apiAccessToken, accountId, contactId)
  return conversations.find((c) => c.status === 'open') || null
}
