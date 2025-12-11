import { RuntimeError } from '@botpress/client'
import {
  SunshineConversationsApi,
  type AppsApi,
  type UsersApi,
  type ConversationsApi,
  type MessagesApi,
  type WebhooksApi,
  type IntegrationsApi,
  type SwitchboardsApi,
  type SwitchboardActionsApi,
  type SwitchboardIntegrationsApi,
  type PostMessageRequest,
  type MessageAuthor,
  type MessageContent,
  Message,
} from './sunshine-api'

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
  private _client: {
    apps: AppsApi
    users: UsersApi
    conversations: ConversationsApi
    messages: MessagesApi
    webhooks: WebhooksApi
    integrations: IntegrationsApi
    switchboard: SwitchboardsApi
    switchboardActions: SwitchboardActionsApi
    switchboardIntegrations: SwitchboardIntegrationsApi
  }

  public constructor(config: { appId: string; keyId: string; keySecret: string }) {
    this._appId = config.appId
    const apiClient = new SunshineConversationsApi.ApiClient()
    const auth = apiClient.authentications['basicAuth']
    auth.username = config.keyId
    auth.password = config.keySecret

    this._client = {
      apps: new SunshineConversationsApi.AppsApi(apiClient),
      users: new SunshineConversationsApi.UsersApi(apiClient),
      conversations: new SunshineConversationsApi.ConversationsApi(apiClient),
      messages: new SunshineConversationsApi.MessagesApi(apiClient),
      webhooks: new SunshineConversationsApi.WebhooksApi(apiClient),
      integrations: new SunshineConversationsApi.IntegrationsApi(apiClient),
      switchboard: new SunshineConversationsApi.SwitchboardsApi(apiClient),
      switchboardActions: new SunshineConversationsApi.SwitchboardActionsApi(apiClient),
      switchboardIntegrations: new SunshineConversationsApi.SwitchboardIntegrationsApi(apiClient),
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

  public async createIntegration(integrationName: string, webhookUrl: string) {
    try {
      const result = await this._client.integrations.createIntegration(this._appId, {
        type: 'custom',
        status: 'active',
        displayName: integrationName,
        webhooks: [
          {
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
          },
        ],
      })

      if (!result?.integration?.id) {
        throw new RuntimeError('Integration creation succeeded but no ID returned')
      }

      return result.integration
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create integration')
    }
  }

  public async deleteIntegration(integrationId: string) {
    try {
      await this._client.integrations.deleteIntegration(this._appId, integrationId)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'delete integration', { integrationId })
    }
  }

  public async findIntegrationByDisplayNameOrThrow(displayName: string) {
    try {
      const integrations = (await this._client.integrations.listIntegrations(this._appId)).integrations || []
      const integration = integrations.find((int) => int.displayName === displayName)
      if (!integration) {
        throw new RuntimeError('Integration not found')
      }

      return integration
    } catch (thrown: unknown) {
      this._handleError(thrown, 'find integration by name', { displayName })
    }
  }

  public async findSwitchboardIntegrationByNameOrThrow(switchboardId: string, name: string) {
    try {
      const result = await this._client.switchboardIntegrations.listSwitchboardIntegrations(this._appId, switchboardId)
      const switchboardIntegrations = result.switchboardIntegrations || []
      const switchboardIntegration = switchboardIntegrations.find(
        (si: { name?: string; id?: string }) => si.name === name
      )
      if (!switchboardIntegration) {
        throw new RuntimeError(`Switchboard integration with name "${name}" not found`)
      }

      return switchboardIntegration
    } catch (thrown: unknown) {
      this._handleError(thrown, 'find switchboard integration by name', { switchboardId, name })
    }
  }

  public async findAgentWorkspaceIntegrationOrThrow(switchboardId: string) {
    try {
      const result = await this._client.switchboardIntegrations.listSwitchboardIntegrations(this._appId, switchboardId)
      const switchboardIntegrations = result.switchboardIntegrations || []
      const agentWorkspaceIntegration = switchboardIntegrations.find(
        (si: { integrationType?: string; id?: string }) => si.integrationType === 'zd:agentWorkspace'
      )
      if (!agentWorkspaceIntegration || !agentWorkspaceIntegration.id) {
        throw new RuntimeError('No agent workspace integration found with integrationType zd:agentWorkspace')
      }

      return agentWorkspaceIntegration
    } catch (thrown: unknown) {
      this._handleError(thrown, 'find agent workspace integration', { switchboardId })
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

  public async getSwitchboardOrThrow() {
    try {
      const switchboards = (await this._client.switchboard.listSwitchboards(this._appId)).switchboards || []
      if (switchboards.length === 0) {
        throw new RuntimeError('No switchboards found')
      } else if (switchboards.length > 1) {
        throw new RuntimeError('Multiple switchboards found')
      }

      const firstSwitchboard = switchboards[0]
      if (!firstSwitchboard) {
        throw new RuntimeError('No switchboards available')
      }

      return firstSwitchboard
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get switchboard ID')
    }
  }

  public async createSwitchboardIntegration(
    switchboardId: string,
    integrationId: string,
    name: string,
    deliverStandbyEvents: boolean = false
  ) {
    try {
      const result = await this._client.switchboardIntegrations.createSwitchboardIntegration(
        this._appId,
        switchboardId,
        {
          name, // Required: Identifier for use in control transfer protocols
          integrationId, // Required for custom integrations
          deliverStandbyEvents, // Optional: defaults to false
        }
      )

      return result.switchboardIntegration
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create switchboard integration', {
        switchboardId,
        integrationId,
        name,
      })
    }
  }

  public async deleteSwitchboardIntegration(switchboardId: string, switchboardIntegrationId: string) {
    try {
      await this._client.switchboardIntegrations.deleteSwitchboardIntegration(
        this._appId,
        switchboardId,
        switchboardIntegrationId
      )
    } catch (thrown: unknown) {
      this._handleError(thrown, 'delete switchboard integration', {
        switchboardId,
        switchboardIntegrationId,
      })
    }
  }
}

export const getSuncoClient = (config: { appId: string; keyId: string; keySecret: string }) => new SuncoClient(config)
export type { SuncoClient }
