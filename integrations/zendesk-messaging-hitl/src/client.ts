import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
const SunshineConversationsClient = require('sunshine-conversations-client')

export type SuncoConfiguration = {
  appId: string
  keyId: string
  keySecret: string
}

export type SuncoUser = {
  id: string
  profile?: {
    givenName?: string
    surname?: string
    email?: string
    avatarUrl?: string
  }
}

export type SuncoConversation = {
  id: string
}

class SuncoClient {
  private _appId: string
  private _client

  public constructor(
    config: SuncoConfiguration,
    private _logger: bp.Logger
  ) {
    this._appId = config.appId
    const apiClient = new SunshineConversationsClient.ApiClient()
    const auth = apiClient.authentications['basicAuth']
    auth.username = config.keyId
    auth.password = config.keySecret

    this._client = {
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
      } catch (createError: any) {
        // If user already exists (409 conflict or similar), try to find it
        // For now, we'll create a new user each time with the externalId
        // The externalId should be unique per botpress user, so this should work
        // If there's a conflict, we'll throw the error
        if (createError.status === 409 || createError.response?.status === 409) {
          // User might already exist, but we can't easily search by externalId
          // So we'll throw an error asking to handle this case
          this._logger.forBot().warn('User with externalId already exists, but cannot retrieve it easily')
          throw new RuntimeError('User with this externalId may already exist')
        }
        throw createError
      }
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        requestBody: props,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to get or create user', errorDetails)
      throw new RuntimeError(`Failed to get or create user: ${errorMessage}`)
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

    const userPost: any = {
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
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        requestBody: userPost,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to create user', errorDetails)
      throw error
    }
  }

  public async createConversation(args: { userId: string }): Promise<SuncoConversation> {
    try {
      // Create conversation with participant directly in the payload
      const conversationPost: any = {
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
      const conversation = await this._client.conversations.createConversation(this._appId, conversationPost)

      if (!conversation?.conversation?.id) {
        throw new RuntimeError('Conversation creation succeeded but no ID returned')
      }

      return conversation.conversation
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        requestBody: args,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to create conversation', errorDetails)
      throw new RuntimeError(`Failed to create conversation: ${errorMessage}`)
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
      let author: any
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
        const messagePost: any = {
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
    } catch (error: any) {
      this._logger.forBot().error('Failed to send message: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to send message: ' + error.message)
    }
  }

  public async createIntegration(integrationName: string, webhookUrl: string): Promise<{ integrationId: string }> {
    try {
      // Create integration with webhooks directly in the payload
      const integrationPost: any = {
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

      this._logger
        .forBot()
        .info(`Attempting to create integration with type: custom, name: ${integrationName}, webhook: ${webhookUrl}`)
      const result = await this._client.integrations.createIntegration(this._appId, integrationPost)

      if (!result?.integration?.id) {
        throw new RuntimeError('Integration creation succeeded but no ID returned')
      }

      this._logger.forBot().info(`Integration created successfully with ID: ${result.integration.id}`)
      return {
        integrationId: result.integration.id,
      }
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to create integration', errorDetails)
      throw new RuntimeError(`Failed to create integration: ${errorMessage}`)
    }
  }

  public async createWebhook(integrationId: string, webhookUrl: string): Promise<string> {
    try {
      const webhookPost: any = {
        target: webhookUrl,
        triggers: ['conversation:message', 'conversation:read'],
        includeFullUser: false,
        includeFullSource: false,
      }

      // Create webhook under the integration - WebhooksApi has methods that take integrationId
      const result = await this._client.webhooks.createIntegrationWebhook(this._appId, integrationId, webhookPost)
      return result.webhook.id
    } catch (error: any) {
      this._logger.forBot().error('Failed to create webhook: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to create webhook: ' + error.message)
    }
  }

  public async deleteWebhook(integrationId: string, webhookId: string): Promise<void> {
    try {
      await this._client.webhooks.deleteIntegrationWebhook(this._appId, integrationId, webhookId)
    } catch (error: any) {
      this._logger.forBot().error('Failed to delete webhook: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to delete webhook: ' + error.message)
    }
  }

  public async deleteIntegration(integrationId: string): Promise<void> {
    try {
      await this._client.integrations.deleteIntegration(this._appId, integrationId)
    } catch (error: any) {
      this._logger.forBot().error('Failed to delete integration: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to delete integration: ' + error.message)
    }
  }

  public async listIntegrations(): Promise<Array<{ id: string; displayName: string }>> {
    try {
      const result = await this._client.integrations.listIntegrations(this._appId)
      return (
        result.integrations?.map((integration: any) => ({
          id: integration.id,
          displayName: integration.displayName,
        })) || []
      )
    } catch (error: any) {
      this._logger.forBot().error('Failed to list integrations: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to list integrations: ' + error.message)
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
      const switchboardIntegration = switchboardIntegrations.find((si: any) => si.name === name)
      return switchboardIntegration ? { id: switchboardIntegration.id } : null
    } catch (error: any) {
      this._logger
        .forBot()
        .error('Failed to find switchboard integration by name: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to find switchboard integration by name: ' + error.message)
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
        (si: any) => si.integrationType === 'zd:agentWorkspace'
      )
      if (!agentWorkspaceIntegration || !agentWorkspaceIntegration.id) {
        throw new RuntimeError('No agent workspace integration found with integrationType zd:agentWorkspace')
      }
      return { id: agentWorkspaceIntegration.id }
    } catch (error: any) {
      if (error instanceof RuntimeError) {
        throw error
      }
      this._logger.forBot().error('Failed to find agent workspace integration: ' + error.message, error?.response?.data)
      throw new RuntimeError('Failed to find agent workspace integration: ' + error.message)
    }
  }

  public async switchboardActionsPassControl(
    conversationId: string,
    switchboardIntegrationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const passControlBody: any = {
        switchboardIntegration: switchboardIntegrationId,
        metadata: metadata || {},
      }

      this._logger
        .forBot()
        .info(
          `Passing control of conversation ${conversationId} to switchboard integration ${switchboardIntegrationId}`
        )

      // Use the switchboard API to accept control
      await this._client.switchboardActions.passControl(this._appId, conversationId, passControlBody)

      this._logger.forBot().info(`Successfully passed control to switchboard integration ${switchboardIntegrationId}`)
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        conversationId,
        switchboardIntegrationId,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to pass control to switchboard', errorDetails)
      throw new RuntimeError(`Failed to pass control to switchboard: ${errorMessage}`)
    }
  }

  public async switchboardActionsOfferControl(
    conversationId: string,
    switchboardIntegrationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const offerControlBody: any = {
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

      this._logger.forBot().info(`Successfully offered control to switchboard integration ${switchboardIntegrationId}`)
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        conversationId,
        switchboardIntegrationId,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to offer control to switchboard', errorDetails)
      throw new RuntimeError(`Failed to offer control to switchboard: ${errorMessage}`)
    }
  }

  public async switchboardActionsReleaseControl(conversationId: string, reason?: string): Promise<void> {
    try {
      const releaseControlBody: any = {
        ...(reason && { reason }),
      }

      this._logger.forBot().info(`Releasing control of conversation ${conversationId}`, { reason })

      // Use the switchboard API to release control
      await this._client.switchboardActions.releaseControl(this._appId, conversationId, releaseControlBody)

      this._logger.forBot().info(`Successfully released control of conversation ${conversationId}`)
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        conversationId,
        reason,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to release control from switchboard', errorDetails)
      throw new RuntimeError(`Failed to release control from switchboard: ${errorMessage}`)
    }
  }

  public async listSwitchboards(): Promise<Array<{ id: string; name?: string }>> {
    try {
      const result = await this._client.switchboard.listSwitchboards(this._appId)
      return (
        result.switchboards?.map((switchboard: any) => ({
          id: switchboard.id,
          name: switchboard.name,
        })) || []
      )
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      this._logger.forBot().error('Failed to list switchboards: ' + errorMessage, error?.response?.data)
      throw new RuntimeError('Failed to list switchboards: ' + errorMessage)
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
    } catch (error: any) {
      if (error instanceof RuntimeError) {
        throw error
      }
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      this._logger.forBot().error('Failed to get switchboard ID: ' + errorMessage, error?.response?.data)
      throw new RuntimeError('Failed to get switchboard ID: ' + errorMessage)
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
      const switchboardIntegrationBody: any = {
        name, // Required: Identifier for use in control transfer protocols
        integrationId, // Required for custom integrations
        deliverStandbyEvents, // Optional: defaults to false
      }

      this._logger
        .forBot()
        .info(
          `Creating switchboard integration for switchboard ${switchboardId} with integration ${integrationId} and name ${name}`
        )

      // Method signature: createSwitchboardIntegration(appId, switchboardId, switchboardIntegrationCreateBody)
      const result = await this._client.switchboardIntegrations.createSwitchboardIntegration(
        this._appId,
        switchboardId,
        switchboardIntegrationBody
      )

      if (!result?.switchboardIntegration?.id) {
        throw new RuntimeError('Switchboard integration creation succeeded but no ID returned')
      }

      const switchboardIntegrationId = result.switchboardIntegration.id
      this._logger.forBot().info(`Successfully created switchboard integration with ID: ${switchboardIntegrationId}`)

      return switchboardIntegrationId
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      const errorDetails = {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        switchboardId,
        integrationId,
        name,
        stack: error?.stack,
      }
      this._logger.forBot().error('Failed to create switchboard integration', errorDetails)
      throw new RuntimeError(`Failed to create switchboard integration: ${errorMessage}`)
    }
  }

  public async deleteSwitchboardIntegration(switchboardId: string, switchboardIntegrationId: string): Promise<void> {
    try {
      this._logger
        .forBot()
        .info(`Deleting switchboard integration ${switchboardIntegrationId} from switchboard ${switchboardId}`)
      await this._client.switchboardIntegrations.deleteSwitchboardIntegration(
        this._appId,
        switchboardId,
        switchboardIntegrationId
      )
      this._logger.forBot().info(`Successfully deleted switchboard integration ${switchboardIntegrationId}`)
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.error?.description ||
        error?.response?.data?.message ||
        JSON.stringify(error?.response?.data) ||
        'Unknown error'
      this._logger.forBot().error('Failed to delete switchboard integration: ' + errorMessage, error?.response?.data)
      throw new RuntimeError('Failed to delete switchboard integration: ' + errorMessage)
    }
  }
}

export const getSuncoClient = (config: SuncoConfiguration, logger: bp.Logger) => new SuncoClient(config, logger)
export type { SuncoClient }
