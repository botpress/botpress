import { RuntimeError } from '@botpress/client'
import {
  SunshineConversationsClient,
  type SuncoConfiguration,
  type SuncoUser,
  type SuncoConversation,
} from './sunshine-client'

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
      cause?: unknown
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
    if (options?.cause instanceof Error) {
      this.cause = options.cause
      this.stack = options.cause.stack
    }
  }
}

class SuncoClient {
  private _appId: string
  private _client: {
    apps: InstanceType<typeof SunshineConversationsClient.AppsApi>
    users: InstanceType<typeof SunshineConversationsClient.UsersApi>
    conversations: InstanceType<typeof SunshineConversationsClient.ConversationsApi>
    messages: InstanceType<typeof SunshineConversationsClient.MessagesApi>
    webhooks: InstanceType<typeof SunshineConversationsClient.WebhooksApi>
    integrations: InstanceType<typeof SunshineConversationsClient.IntegrationsApi>
    switchboard: InstanceType<typeof SunshineConversationsClient.SwitchboardsApi>
    switchboardActions: InstanceType<typeof SunshineConversationsClient.SwitchboardActionsApi>
    switchboardIntegrations: InstanceType<typeof SunshineConversationsClient.SwitchboardIntegrationsApi>
  }

  public constructor(config: SuncoConfiguration) {
    this._appId = config.appId
    const apiClient = new SunshineConversationsClient.ApiClient()
    const auth = apiClient.authentications['basicAuth']
    auth.username = config.keyId
    auth.password = config.keySecret

    this._client = {
      apps: new SunshineConversationsClient.AppsApi(apiClient),
      users: new SunshineConversationsClient.UsersApi(apiClient),
      conversations: new SunshineConversationsClient.ConversationsApi(apiClient),
      messages: new SunshineConversationsClient.MessagesApi(apiClient),
      webhooks: new SunshineConversationsClient.WebhooksApi(apiClient),
      integrations: new SunshineConversationsClient.IntegrationsApi(apiClient),
      switchboard: new SunshineConversationsClient.SwitchboardsApi(apiClient),
      switchboardActions: new SunshineConversationsClient.SwitchboardActionsApi(apiClient),
      switchboardIntegrations: new SunshineConversationsClient.SwitchboardIntegrationsApi(apiClient),
    }
  }

  private _isNetworkError(error: unknown): error is {
    status?: number
    body?: any
    response?: {
      status?: number
      text?: string
      req: {
        method: string
        url: string
        headers: Record<string, string>
      }
      header: Record<string, string>
    }
  } {
    return typeof error === 'object' && error !== null && 'status' in error
  }

  private _getNetworkErrorDetails(error: unknown): { message: string; status?: number; data?: unknown } | undefined {
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

    return {
      message: message ?? 'Unknown error',
      status: error.status ?? error.response?.status,
      data: error.body,
    }
  }

  private _handleError(
    thrown: unknown,
    operationName: string,
    requestBody?: unknown,
    additionalContext?: Record<string, unknown>
  ): never {
    if (thrown instanceof SuncoClientError) {
      throw thrown
    }

    const networkErrorDetails = this._getNetworkErrorDetails(thrown)
    const errorMessage = networkErrorDetails?.message || String(thrown)

    throw new SuncoClientError(errorMessage, operationName, {
      status: networkErrorDetails?.status,
      data: networkErrorDetails?.data,
      requestBody,
      additionalContext,
      cause: thrown instanceof Error ? thrown : undefined,
    })
  }

  public async getApp(): Promise<{
    id: string
    displayName?: string
    subdomain?: string
    settings?: unknown
    metadata?: unknown
  }> {
    try {
      const data = await this._client.apps.getApp(this._appId)
      if (!data?.app?.id) {
        throw new RuntimeError('App retrieval succeeded but no app data returned')
      }
      return {
        id: data.app.id,
        displayName: data.app.displayName,
        subdomain: data.app.subdomain,
        settings: data.app.settings, // mutable
        metadata: data.app.metadata, // mutable
      }
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get app', { appId: this._appId })
    }
  }

  public async getOrCreateUser(props: {
    name?: string
    email?: string
    avatarUrl?: string
    externalId: string
  }): Promise<SuncoUser> {
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

  public async getUserByIdOrExternalId(userIdOrExternalId: string): Promise<SuncoUser | null> {
    try {
      const result = await this._client.users.getUser(this._appId, userIdOrExternalId)
      return {
        id: result.user.id,
        profile: result.user.profile,
      }
    } catch (thrown: unknown) {
      const networkError = this._getNetworkErrorDetails(thrown)
      if (networkError && networkError.status === 404) {
        return null
      }

      this._handleError(thrown, 'get user by ID or external ID', undefined, { userIdOrExternalId })
    }
  }

  public async createUser(props: {
    name?: string
    email?: string
    avatarUrl?: string
    externalId: string
  }): Promise<SuncoUser> {
    const { name, email, avatarUrl, externalId } = props

    const nameParts = name?.split(' ') || []
    const givenName = nameParts[0] || ''
    const surname = nameParts.slice(1).join(' ') || ''

    const userPost = {
      externalId,
      profile: {
        ...(givenName.length && { givenName }),
        ...(surname.length && { surname }),
        ...(email && { email }),
        ...(avatarUrl && { avatarUrl }),
      },
    }

    try {
      const result = await this._client.users.createUser(this._appId, userPost)
      return result.user
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create user', userPost)
    }
  }

  public async createConversation(args: { userId: string }): Promise<SuncoConversation> {
    try {
      const conversationPost: Record<string, unknown> = {
        type: 'personal',
        participants: [
          {
            userId: args.userId,
            subscribeSDKClient: false,
          },
        ],
        displayName: 'HITL Conversation',
      }

      const data = await this._client.conversations.createConversation(this._appId, conversationPost)

      if (!data?.conversation?.id) {
        throw new RuntimeError('Conversation creation succeeded but no ID returned')
      }

      return data.conversation
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create conversation', args)
    }
  }

  public async sendMessage(
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
    messageParts: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; mediaUrl: string }
      | { type: 'file'; mediaUrl: string; mediaType?: string }
    >
  ): Promise<string> {
    try {
      let messageId: string | undefined

      // Determine author object based on input type
      let author: Record<string, unknown>
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
        const messagePost: Record<string, unknown> = {
          author,
        }

        if (part.type === 'text') {
          messagePost.content = {
            type: 'text',
            text: part.text,
          }
        } else if (part.type === 'image') {
          messagePost.content = {
            type: 'image',
            mediaUrl: part.mediaUrl,
          }
        } else if (part.type === 'file') {
          messagePost.content = {
            type: 'file',
            mediaUrl: part.mediaUrl,
            mediaType: part.mediaType,
          }
        }

        const result = await this._client.messages.postMessage(this._appId, conversationId, messagePost)
        if (result.messages && result.messages.length > 0) {
          messageId = result.messages[0].id
        }
      }

      if (!messageId) {
        throw new RuntimeError('Failed to send message')
      }

      return messageId
    } catch (thrown: unknown) {
      this._handleError(thrown, 'send message', { conversationId, messageParts })
    }
  }

  public async createIntegration(integrationName: string, webhookUrl: string): Promise<{ integrationId: string }> {
    const integrationPost: Record<string, unknown> = {
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
    }

    try {
      const result = await this._client.integrations.createIntegration(this._appId, integrationPost)

      if (!result?.integration?.id) {
        throw new RuntimeError('Integration creation succeeded but no ID returned')
      }

      return {
        integrationId: result.integration.id,
      }
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create integration', integrationPost)
    }
  }

  public async createWebhook(integrationId: string, webhookUrl: string): Promise<string> {
    const webhookPost: Record<string, unknown> = {
      target: webhookUrl,
      triggers: ['conversation:message', 'conversation:read'],
      includeFullUser: false,
      includeFullSource: false,
    }

    try {
      const result = await this._client.webhooks.createIntegrationWebhook(this._appId, integrationId, webhookPost)
      return result.webhook.id
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create webhook', webhookPost, { integrationId })
    }
  }

  public async deleteWebhook(integrationId: string, webhookId: string): Promise<void> {
    try {
      await this._client.webhooks.deleteIntegrationWebhook(this._appId, integrationId, webhookId)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'delete webhook', undefined, { integrationId, webhookId })
    }
  }

  public async deleteIntegration(integrationId: string): Promise<void> {
    try {
      await this._client.integrations.deleteIntegration(this._appId, integrationId)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'delete integration', undefined, { integrationId })
    }
  }

  public async listIntegrations(): Promise<Array<{ id: string; displayName: string }>> {
    try {
      const result = await this._client.integrations.listIntegrations(this._appId)
      return (
        result.integrations?.map((integration: { id?: string; displayName?: string }) => ({
          id: integration.id,
          displayName: integration.displayName,
        })) || []
      )
    } catch (thrown: unknown) {
      this._handleError(thrown, 'list integrations')
    }
  }

  public async findIntegrationByDisplayNameOrThrow(displayName: string): Promise<{ id: string }> {
    const integrations = await this.listIntegrations()
    const integration = integrations.find((int) => int.displayName === displayName)
    if (!integration) {
      throw new RuntimeError('Integration not found')
    }
    return integration
  }

  public async findSwitchboardIntegrationByNameOrThrow(switchboardId: string, name: string): Promise<{ id: string }> {
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
      this._handleError(thrown, 'find switchboard integration by name', undefined, { switchboardId, name })
    }
  }

  public async findAgentWorkspaceIntegrationOrThrow(switchboardId: string): Promise<{ id: string }> {
    try {
      const result = await this._client.switchboardIntegrations.listSwitchboardIntegrations(this._appId, switchboardId)
      const switchboardIntegrations = result.switchboardIntegrations || []
      const agentWorkspaceIntegration = switchboardIntegrations.find(
        (si: { integrationType?: string; id?: string }) => si.integrationType === 'zd:agentWorkspace'
      )
      if (!agentWorkspaceIntegration || !agentWorkspaceIntegration.id) {
        throw new RuntimeError('No agent workspace integration found with integrationType zd:agentWorkspace')
      }
      return { id: agentWorkspaceIntegration.id }
    } catch (thrown: unknown) {
      this._handleError(thrown, 'find agent workspace integration', undefined, { switchboardId })
    }
  }

  public async switchboardActionsPassControl(
    conversationId: string,
    switchboardIntegrationId: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    try {
      const passControlBody: Record<string, unknown> = {
        switchboardIntegration: switchboardIntegrationId,
        metadata: metadata || {},
      }

      await this._client.switchboardActions.passControl(this._appId, conversationId, passControlBody)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'pass control to switchboard', undefined, {
        conversationId,
        switchboardIntegrationId,
      })
    }
  }

  public async switchboardActionsOfferControl(
    conversationId: string,
    switchboardIntegrationId: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    try {
      const offerControlBody: Record<string, unknown> = {
        switchboardIntegration: switchboardIntegrationId,
        metadata: metadata || {},
      }
      await this._client.switchboardActions.offerControl(this._appId, conversationId, offerControlBody)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'offer control to switchboard', undefined, {
        conversationId,
        switchboardIntegrationId,
      })
    }
  }

  public async switchboardActionsReleaseControl(conversationId: string, reason?: string): Promise<void> {
    try {
      const releaseControlBody: Record<string, unknown> = {
        ...(reason && { reason }),
      }
      await this._client.switchboardActions.releaseControl(this._appId, conversationId, releaseControlBody)
    } catch (thrown: unknown) {
      this._handleError(thrown, 'release control from switchboard', undefined, {
        conversationId,
        reason,
      })
    }
  }

  public async listSwitchboards(): Promise<Array<{ id: string; name?: string }>> {
    try {
      const result = await this._client.switchboard.listSwitchboards(this._appId)
      return (
        result.switchboards?.map((switchboard: { id?: string; name?: string }) => ({
          id: switchboard.id,
          name: switchboard.name,
        })) || []
      )
    } catch (thrown: unknown) {
      this._handleError(thrown, 'list switchboards')
    }
  }

  public async getSwitchboardIdOrThrow(): Promise<string> {
    try {
      const switchboards = await this.listSwitchboards()
      if (switchboards.length === 0) {
        throw new RuntimeError('No switchboards found')
      } else if (switchboards.length > 1) {
        throw new RuntimeError('Multiple switchboards found')
      }
      const firstSwitchboard = switchboards[0]
      if (!firstSwitchboard) {
        throw new RuntimeError('No switchboards available')
      }
      return firstSwitchboard.id
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get switchboard ID')
    }
  }

  public async createSwitchboardIntegration(
    switchboardId: string,
    integrationId: string,
    name: string,
    deliverStandbyEvents: boolean = false
  ): Promise<string> {
    try {
      const switchboardIntegrationBody: Record<string, unknown> = {
        name, // Required: Identifier for use in control transfer protocols
        integrationId, // Required for custom integrations
        deliverStandbyEvents, // Optional: defaults to false
      }

      const result = await this._client.switchboardIntegrations.createSwitchboardIntegration(
        this._appId,
        switchboardId,
        switchboardIntegrationBody
      )

      if (!result?.switchboardIntegration?.id) {
        throw new RuntimeError('Switchboard integration creation succeeded but no ID returned')
      }

      const switchboardIntegrationId = result.switchboardIntegration.id

      return switchboardIntegrationId
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create switchboard integration', undefined, {
        switchboardId,
        integrationId,
        name,
      })
    }
  }

  public async deleteSwitchboardIntegration(switchboardId: string, switchboardIntegrationId: string): Promise<void> {
    try {
      await this._client.switchboardIntegrations.deleteSwitchboardIntegration(
        this._appId,
        switchboardId,
        switchboardIntegrationId
      )
    } catch (thrown: unknown) {
      this._handleError(thrown, 'delete switchboard integration', undefined, {
        switchboardId,
        switchboardIntegrationId,
      })
    }
  }
}

export const getSuncoClient = (config: SuncoConfiguration) => new SuncoClient(config)
export type { SuncoClient }
