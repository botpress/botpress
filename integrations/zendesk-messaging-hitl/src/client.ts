import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { BASE_HEADERS } from './api/const'
import {
  SunshineConversationsApi,
  type AppsApi,
  type UsersApi,
  type ConversationsApi,
  type MessagesApi,
  type WebhooksApi,
  type SwitchboardActionsApi,
  type PostMessageRequest,
  type MessageAuthor,
  type MessageContent,
  Message,
} from './sunshine-api'
import { StoredCredentials } from './types'

export class SuncoClientError extends RuntimeError {
  public readonly operationName: string
  public readonly status?: number
  public readonly data?: unknown
  public readonly requestBody?: unknown
  public readonly additionalContext?: Record<string, unknown>

  public constructor(
    message: string,
    operationName: string,
    options?: {
      status?: number
      data?: unknown
      requestBody?: unknown
      additionalContext?: Record<string, unknown>
    }
  ) {
    const details: string[] = [message]
    if (options?.status) {
      details.push(`Status: ${options.status}`)
    }
    if (options?.data) {
      details.push(`Data: ${JSON.stringify(options.data)}`)
    }
    if (options?.requestBody) {
      details.push(`Request Body: ${JSON.stringify(options.requestBody)}`)
    }
    if (options?.additionalContext) {
      const contextStr = Object.entries(options.additionalContext)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ')
      if (contextStr) {
        details.push(`Context: ${contextStr}`)
      }
    }
    super(`Failed to ${operationName}: ${details.join(' | ')}`)
    this.name = 'SuncoClientError'
    this.operationName = operationName
    this.status = options?.status
    this.data = options?.data
    this.requestBody = options?.requestBody
    this.additionalContext = options?.additionalContext
  }
}

class SuncoClient {
  private _appId: string
  private _baseUrl: string
  private _token: string
  private _client: {
    apps: AppsApi
    users: UsersApi
    conversations: ConversationsApi
    messages: MessagesApi
    webhooks: WebhooksApi
    switchboardActions: SwitchboardActionsApi
  }

  public constructor(credentials: StoredCredentials) {
    this._appId = credentials.appId
    this._token = credentials.token
    const apiClient = new SunshineConversationsApi.ApiClient()

    if (!credentials.subdomain) {
      throw new RuntimeError('Subdomain is required for OAuth')
    }
    apiClient.basePath = `https://${credentials.subdomain}.zendesk.com/sc`
    const auth = apiClient.authentications['bearerAuth'] as { accessToken: string }
    auth.accessToken = credentials.token
    apiClient.defaultHeaders = { ...apiClient.defaultHeaders, ...BASE_HEADERS }
    this._baseUrl = `https://${credentials.subdomain}.zendesk.com/sc`

    this._client = {
      apps: new SunshineConversationsApi.AppsApi(apiClient),
      users: new SunshineConversationsApi.UsersApi(apiClient),
      conversations: new SunshineConversationsApi.ConversationsApi(apiClient),
      messages: new SunshineConversationsApi.MessagesApi(apiClient),
      webhooks: new SunshineConversationsApi.WebhooksApi(apiClient),
      switchboardActions: new SunshineConversationsApi.SwitchboardActionsApi(apiClient),
    }
  }

  private _isNetworkError(error: unknown): error is {
    status?: number
    body?: any
    request?: {
      data?: unknown
      body?: unknown
    }
    response?: {
      status?: number
      text?: string
      req: {
        method: string
        url: string
        headers: Record<string, string>
        data?: unknown
        body?: unknown
      }
      header: Record<string, string>
    }
  } {
    return typeof error === 'object' && error !== null && 'status' in error
  }

  private _getNetworkErrorDetails(error: unknown):
    | {
        message: string
        status?: number
        data?: unknown
        requestBody?: unknown
      }
    | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined
    }

    if (!this._isNetworkError(error)) {
      return undefined
    }

    // Parse error message from various formats
    let message: string | undefined

    // Check for Sunshine Conversations API error format (errors array in body)
    if (Array.isArray(error.body?.errors)) {
      const errorMessages = (error.body.errors as Array<{ title?: string; code?: string }>)
        .map((err) => {
          if (err.title) {
            return err.code ? `${err.title}: ${err.code}` : err.title
          }
          return JSON.stringify(err)
        })
        .filter((msg): msg is string => msg !== undefined)

      if (errorMessages.length > 0) {
        message = errorMessages.join('; ')
      }
    } else if (error.body?.message?.length) {
      message = error.body?.message
    } else if (error.body) {
      message = JSON.stringify(error.body)
    }

    const requestBody =
      error.request?.data ?? error.request?.body ?? error.response?.req?.data ?? error.response?.req?.body

    return {
      message: message ?? 'Unknown error',
      status: error.status ?? error.response?.status,
      data: error.body,
      requestBody,
    }
  }

  private _handleError(thrown: unknown, operationName: string, additionalContext?: Record<string, unknown>): never {
    if (thrown instanceof SuncoClientError) {
      throw thrown
    }

    const networkErrorDetails = this._getNetworkErrorDetails(thrown)
    const errorMessage = networkErrorDetails?.message || String(thrown)

    throw new SuncoClientError(errorMessage, operationName, {
      status: networkErrorDetails?.status,
      data: networkErrorDetails?.data,
      requestBody: networkErrorDetails?.requestBody,
      additionalContext,
    })
  }

  public async getApp() {
    try {
      const result = await this._client.apps.getApp(this._appId)

      return result.app
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get app', { appId: this._appId })
    }
  }

  public async getOrCreateUser(props: { name?: string; email?: string; avatarUrl?: string; externalId: string }) {
    try {
      const existingUser = await this.getUserByIdOrExternalId(props.externalId)
      if (existingUser) {
        return existingUser
      }

      return await this.createUser(props)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get or create user', props)
    }
  }

  public async getUserByIdOrExternalId(userIdOrExternalId: string) {
    try {
      const result = await this._client.users.getUser(this._appId, userIdOrExternalId)

      return result.user
    } catch (thrown: unknown) {
      const networkError = this._getNetworkErrorDetails(thrown)
      if (networkError && networkError.status === 404) {
        return null
      }

      this._handleError(thrown, 'get user by ID or external ID', { userIdOrExternalId })
    }
  }

  public async createUser(props: { name?: string; email?: string; avatarUrl?: string; externalId: string }) {
    const { name, email, avatarUrl, externalId } = props

    const nameParts = name?.split(' ') || []
    const givenName = nameParts[0] || ''
    const surname = nameParts.slice(1).join(' ') || ''

    try {
      const result = await this._client.users.createUser(this._appId, {
        externalId,
        profile: {
          ...(givenName.length && { givenName }),
          ...(surname.length && { surname }),
          ...(email && { email }),
          ...(avatarUrl && { avatarUrl }),
        },
      })

      return result.user
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create user')
    }
  }

  public async createConversation(args: { userId: string }) {
    try {
      const result = await this._client.conversations.createConversation(this._appId, {
        type: 'personal',
        participants: [
          {
            userId: args.userId,
            subscribeSDKClient: false,
          },
        ],
        displayName: 'HITL Conversation',
      })

      if (!result?.conversation?.id) {
        throw new RuntimeError('Conversation creation succeeded but no ID returned')
      }

      return result.conversation
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create conversation')
    }
  }

  public async sendMessages(
    conversationId: string,
    userIdOrAuthor:
      | string
      | undefined
      | {
          type?: 'user' | 'business'
          subtypes?: string[]
          displayName?: string
          avatarUrl?: string
        },
    messageParts: Array<MessageContent>
  ) {
    try {
      let message: Message | undefined

      let author: MessageAuthor
      if (typeof userIdOrAuthor === 'string') {
        // userId provided
        author = {
          type: 'user',
          userId: userIdOrAuthor,
        }
      } else if (userIdOrAuthor && typeof userIdOrAuthor === 'object') {
        // Author object provided - default type to 'business' if not specified
        author = {
          type: userIdOrAuthor.type || 'business',
          ...(userIdOrAuthor.subtypes && { subtypes: userIdOrAuthor.subtypes }),
          ...(userIdOrAuthor.displayName && { displayName: userIdOrAuthor.displayName }),
          ...(userIdOrAuthor.avatarUrl && { avatarUrl: userIdOrAuthor.avatarUrl }),
        }
      } else {
        // No userId or author, default to business
        author = {
          type: 'business',
        }
      }

      for (const part of messageParts) {
        const messagePost: PostMessageRequest = {
          author,
          content: part,
        }

        const result = await this._client.messages.postMessage(this._appId, conversationId, messagePost)
        if (result.messages && result.messages.length > 0) {
          const firstMessage = result.messages[0]
          if (firstMessage?.id) {
            message = firstMessage
          }
        }
      }

      if (!message) {
        throw new RuntimeError('Failed to send message')
      }

      return message
    } catch (thrown: unknown) {
      this._handleError(thrown, 'send message', { conversationId, messageParts })
    }
  }

  public async listWebhooks(integrationId: string) {
    try {
      const result = await this._client.webhooks.listWebhooks(this._appId, integrationId)
      return result.webhooks || []
    } catch (thrown: unknown) {
      this._handleError(thrown, 'list webhooks', { integrationId })
    }
  }

  public async createWebhook(integrationId: string, webhookUrl: string) {
    try {
      const result = await this._client.webhooks.createWebhook(
        this._appId,
        integrationId,
        this._getWebhookDefinitionFor(webhookUrl)
      )

      return result.webhook
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create webhook', { integrationId, webhookUrl })
    }
  }

  public async updateWebhook(integrationId: string, webhookId: string, webhookUrl: string) {
    try {
      const result = await this._client.webhooks.updateWebhook(
        this._appId,
        integrationId,
        webhookId,
        this._getWebhookDefinitionFor(webhookUrl)
      )

      return result.webhook
    } catch (thrown: unknown) {
      this._handleError(thrown, 'update webhook', { integrationId, webhookId, webhookUrl })
    }
  }

  public async deleteWebhook(integrationId: string, webhookId: string) {
    try {
      await this._client.webhooks.deleteWebhook(this._appId, integrationId, webhookId)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'delete webhook', { integrationId, webhookId })
    }
  }

  public async switchboardActionsPassControl(
    conversationId: string,
    switchboardIntegrationId: string,
    metadata?: Record<string, string>
  ) {
    try {
      await this._client.switchboardActions.passControl(this._appId, conversationId, {
        switchboardIntegration: switchboardIntegrationId,
        metadata: metadata || {},
      })
    } catch (thrown: unknown) {
      this._handleError(thrown, 'pass control to switchboard', {
        conversationId,
        switchboardIntegrationId,
        metadata,
      })
    }
  }

  public async switchboardActionsOfferControl(
    conversationId: string,
    switchboardIntegrationId: string,
    metadata?: Record<string, string>
  ) {
    try {
      await this._client.switchboardActions.offerControl(this._appId, conversationId, {
        switchboardIntegration: switchboardIntegrationId,
        metadata: metadata || {},
      })
    } catch (thrown: unknown) {
      this._handleError(thrown, 'offer control to switchboard', {
        conversationId,
        switchboardIntegrationId,
        metadata,
      })
    }
  }

  public async switchboardActionsReleaseControl(conversationId: string) {
    try {
      await this._client.switchboardActions.releaseControl(this._appId, conversationId)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'release control from switchboard', {
        conversationId,
      })
    }
  }

  public async downloadAndUploadAttachment(sourceUrl: string, conversationId: string): Promise<string> {
    // Download the file from the source URL
    const response = await axios.get(sourceUrl, {
      responseType: 'arraybuffer',
    })

    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const fileBuffer = Buffer.from(response.data)

    // Extract filename from URL or use a default
    const urlPath = new URL(sourceUrl).pathname
    const filename = urlPath.split('/').pop() || 'file'

    const formData = new FormData()
    formData.append('source', new Blob([fileBuffer], { type: contentType }), filename)

    // Upload via axios instead of the SDK because the sunshine-conversations-client SDK
    // uses superagent internally, which doesn't properly handle Node.js File/Blob objects.
    // Superagent expects stream-like objects with .on() method, but Node.js 18+ File/Blob
    // don't implement stream interfaces. Using axios with native FormData works correctly.
    const uploadResponse = await axios.postForm(`${this._baseUrl}/v2/apps/${this._appId}/attachments`, formData, {
      params: { access: 'public', for: 'message', conversationId },
      headers: { Authorization: `Bearer ${this._token}` },
    })

    const mediaUrl = uploadResponse.data?.attachment?.mediaUrl
    if (!mediaUrl) {
      throw new RuntimeError('Failed to upload attachment to Zendesk: no mediaUrl returned')
    }

    return mediaUrl
  }

  private _getWebhookDefinitionFor(webhookUrl: string) {
    return {
      target: webhookUrl,
      triggers: [
        'conversation:message',
        'conversation:remove',
        'conversation:join',
        'conversation:postback',
        'switchboard:releaseControl',
      ],
      includeFullUser: false,
      includeFullSource: false,
    }
  }
}

export const getSuncoClient = (credentials: StoredCredentials) => new SuncoClient(credentials)
export type { SuncoClient }
