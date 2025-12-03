import { RuntimeError } from '@botpress/client'
import {
  SunshineConversationsClient,
  type SuncoConfiguration,
  type SuncoUser,
  type SuncoConversation,
} from './sunshine-client'
import { Logger } from './types'

type NetworkError = {
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
}

function getNetworkError(
  error: unknown
): { message: string; status?: number; statusText?: string; data?: unknown } | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const networkError = error as NetworkError

  // Check if it looks like a network error
  if (!('status' in networkError)) {
    return undefined
  }

  // Parse error message from various formats
  let message: string | undefined

  // Check for Sunshine Conversations API error format (errors array in body)
  if (Array.isArray(networkError.body?.errors)) {
    const errorMessages = (networkError.body.errors as Array<{ title?: string; code?: string }>)
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
  } else if (networkError.body?.message?.length) {
    message = networkError.body?.message
  } else if (networkError.body) {
    message = JSON.stringify(networkError.body)
  }

  return {
    message: message ?? 'Unknown error',
    status: networkError.status ?? networkError.response?.status,
    data: networkError.body,
  }
}

type SuncoClientApis = {
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

class SuncoClient {
  private _appId: string
  private _client: SuncoClientApis

  public constructor(
    config: SuncoConfiguration,
    private _logger: Logger
  ) {
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

  private _handleError(
    thrown: unknown,
    operationName: string,
    requestBody?: unknown,
    additionalContext?: Record<string, unknown>
  ): never {
    // If it's already a RuntimeError, re-throw it without wrapping
    if (thrown instanceof RuntimeError) {
      throw thrown
    }

    const networkError = getNetworkError(thrown)
    const errorMessage = networkError?.message || String(thrown)
    const errorDetails: Record<string, unknown> = {
      message: errorMessage,
      status: networkError?.status,
      statusText: networkError?.statusText,
      data: networkError?.data,
      stack: thrown instanceof Error ? thrown.stack : undefined,
    }

    if (requestBody) {
      errorDetails.requestBody = requestBody
    }

    if (additionalContext) {
      Object.assign(errorDetails, additionalContext)
    }
    this._logger.forBot().error(`Failed to ${operationName}`, errorDetails)
    throw new RuntimeError(`Failed to ${operationName}: ${errorMessage}`)
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
        settings: data.app.settings,
        metadata: data.app.metadata,
      }
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get app', { appId: this._appId })
    }
  }

  public async getOrCreateUser(props: {
    name?: string
    email?: string
    pictureUrl?: string
    botpressUserId: string
  }): Promise<SuncoUser> {
    this._logger.forBot().info('getOrCreateUser called', { props })
    try {
      // Try to create user first
      // If externalId already exists, the API might return the existing user or throw an error
      try {
        return await this._createUser(props)
      } catch (createError: unknown) {
        // If user already exists (409 conflict or similar), try to find it
        const networkError = getNetworkError(createError)
        if (networkError && networkError.status === 409) {
          // Try to get the existing user by externalId
          const existingUser = await this._getUserByIdOrExternalId(props.botpressUserId)
          if (existingUser) {
            this._logger.forBot().info(`Found existing user with ID: ${existingUser.id}`)
            return existingUser
          }
          // If we can't find it, throw the original error
          this._logger.forBot().warn('User with externalId already exists but could not be retrieved')
          throw new RuntimeError('User with this externalId may already exist')
        }
        throw createError
      }
    } catch (thrown: unknown) {
      this._handleError(thrown, 'get or create user', props)
    }
  }

  private async _getUserByIdOrExternalId(userIdOrExternalId: string): Promise<SuncoUser | null> {
    try {
      // Use getUser endpoint which accepts both userId and externalId
      const result = await this._client.users.getUser(this._appId, userIdOrExternalId)
      return {
        id: result.user.id,
        profile: result.user.profile,
      }
    } catch (thrown: unknown) {
      // If user not found (404), return null
      const networkError = getNetworkError(thrown)
      if (networkError && networkError.status === 404) {
        return null
      }

      const errorMessage = networkError?.message || String(thrown)
      this._logger.forBot().error(`Failed to get user by ID or externalId: ${errorMessage}`, thrown)
      return null
    }
  }

  private async _createUser(props: {
    name?: string
    email?: string
    pictureUrl?: string
    botpressUserId: string
  }): Promise<SuncoUser> {
    const nameParts = props.name?.split(' ') || []
    const givenName = nameParts[0] || ''
    const surname = nameParts.slice(1).join(' ') || ''

    const userPost: Record<string, unknown> = {
      externalId: props.botpressUserId,
      signedUpAt: new Date().toISOString(),
      profile: {
        givenName,
        ...(surname.length && { surname }),
        email: props.email,
        ...(props.pictureUrl && { avatarUrl: props.pictureUrl }),
      },
    }

    try {
      this._logger.forBot().info(`Creating user with externalId: ${props.botpressUserId}`, { userPost })
      const result = await this._client.users.createUser(this._appId, userPost)
      return result.user
    } catch (thrown: unknown) {
      this._handleError(thrown, 'create user', userPost)
    }
  }

  public async createConversation(args: { userId: string }): Promise<SuncoConversation> {
    try {
      // Create conversation with participant directly in the payload
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

      this._logger.forBot().info(`Creating conversation for user: ${args.userId}`, { conversationPost })
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
    // Create integration with webhooks directly in the payload
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
      // Create webhook under the integration - WebhooksApi has methods that take integrationId
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

  public async findSwitchboardIntegrationByName(switchboardId: string, name: string): Promise<{ id: string } | null> {
    try {
      const result = await this._client.switchboardIntegrations.listSwitchboardIntegrations(this._appId, switchboardId)
      const switchboardIntegrations = result.switchboardIntegrations || []
      const switchboardIntegration = switchboardIntegrations.find(
        (si: { name?: string; id?: string }) => si.name === name
      )
      return switchboardIntegration ? { id: switchboardIntegration.id } : null
    } catch (thrown: unknown) {
      this._handleError(thrown, 'find switchboard integration by name', undefined, { switchboardId, name })
    }
  }

  public async findSwitchboardIntegrationByNameOrThrow(switchboardId: string, name: string): Promise<{ id: string }> {
    const switchboardIntegration = await this.findSwitchboardIntegrationByName(switchboardId, name)
    if (!switchboardIntegration) {
      throw new RuntimeError(`Switchboard integration with name "${name}" not found`)
    }
    return switchboardIntegration
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

      // Use the switchboard API to accept control
      await this._client.switchboardActions.passControl(this._appId, conversationId, passControlBody)

      this._logger.forBot().info(`Successfully passed control to switchboard integration ${switchboardIntegrationId}`)
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

      this._logger
        .forBot()
        .info(
          `Offering control of conversation ${conversationId} to switchboard integration ${switchboardIntegrationId}`
        )

      // Use the switchboard API to offer control
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

      // Use the switchboard API to release control
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
        throw new RuntimeError('No switchboards found. Please create a switchboard in Sunshine Conversations first.')
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
      // According to SwitchboardIntegrationCreateBody model:
      // - name is REQUIRED (Identifier for use in control transfer protocols)
      // - integrationId is required when linking a custom integration
      // - deliverStandbyEvents is optional (Boolean)
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

export const getSuncoClient = (config: SuncoConfiguration, logger: Logger) => new SuncoClient(config, logger)
export type { SuncoClient }
