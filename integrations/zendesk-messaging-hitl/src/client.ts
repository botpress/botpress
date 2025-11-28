import * as sdk from '@botpress/sdk'
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
          throw new sdk.RuntimeError('User with this externalId may already exist')
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
      throw new sdk.RuntimeError(`Failed to get or create user: ${errorMessage}`)
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

  public async createConversation(args: {
    userId: string
    messages: Array<{
      role: 'appUser' | 'appMaker'
      type: string
      text?: string
      mediaUrl?: string
      mediaType?: string
    }>
  }): Promise<SuncoConversation> {
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
        throw new sdk.RuntimeError('Conversation creation succeeded but no ID returned')
      }

      /*// Send messages
      for (const message of args.messages) {
        const messagePost: any = {
          author: {
            type: message.role === 'appUser' ? 'user' : 'business',
            userId: message.role === 'appUser' ? args.userId : undefined,
          },
        }

        if (message.type === 'text' && message.text) {
          messagePost.content = {
            type: 'text',
            text: message.text,
          }
        } else if (message.type === 'image' && message.mediaUrl) {
          messagePost.content = {
            type: 'image',
            mediaUrl: message.mediaUrl,
          }
        } else if (message.type === 'file' && message.mediaUrl) {
          messagePost.content = {
            type: 'file',
            mediaUrl: message.mediaUrl,
            mediaType: message.mediaType,
          }
        }

        await this._client.messages.postMessage(this._appId, conversation.conversation.id, messagePost)
      }*/

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
      throw new sdk.RuntimeError(`Failed to create conversation: ${errorMessage}`)
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
        throw new sdk.RuntimeError('Failed to send message')
      }

      return messageId
    } catch (error: any) {
      this._logger.forBot().error('Failed to send message: ' + error.message, error?.response?.data)
      throw new sdk.RuntimeError('Failed to send message: ' + error.message)
    }
  }

  public async createIntegration(
    integrationName: string,
    webhookUrl: string
  ): Promise<{ integrationId: string; webhookId: string }> {
    try {
      // Create integration with webhooks directly in the payload
      const integrationPost: any = {
        type: 'custom',
        status: 'active',
        displayName: integrationName,
        webhooks: [
          {
            target: webhookUrl,
            triggers: ['conversation:message'],
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
        throw new sdk.RuntimeError('Integration creation succeeded but no ID returned')
      }

      // Extract webhook ID from the response
      const webhookId = result.integration.webhooks?.[0]?.id || result.webhook?.id || ''

      this._logger
        .forBot()
        .info(`Integration created successfully with ID: ${result.integration.id}, Webhook ID: ${webhookId}`)
      return {
        integrationId: result.integration.id,
        webhookId,
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
      throw new sdk.RuntimeError(`Failed to create integration: ${errorMessage}`)
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
      throw new sdk.RuntimeError('Failed to create webhook: ' + error.message)
    }
  }

  public async deleteWebhook(integrationId: string, webhookId: string): Promise<void> {
    try {
      await this._client.webhooks.deleteIntegrationWebhook(this._appId, integrationId, webhookId)
    } catch (error: any) {
      this._logger.forBot().error('Failed to delete webhook: ' + error.message, error?.response?.data)
      throw new sdk.RuntimeError('Failed to delete webhook: ' + error.message)
    }
  }

  public async deleteIntegration(integrationId: string): Promise<void> {
    try {
      await this._client.integrations.deleteIntegration(this._appId, integrationId)
    } catch (error: any) {
      this._logger.forBot().error('Failed to delete integration: ' + error.message, error?.response?.data)
      throw new sdk.RuntimeError('Failed to delete integration: ' + error.message)
    }
  }

  public async listIntegrations(): Promise<Array<{ id: string; name: string }>> {
    try {
      const result = await this._client.integrations.listIntegrations(this._appId)
      return (
        result.integrations?.map((integration: any) => ({
          id: integration.id,
          name: integration.name,
        })) || []
      )
    } catch (error: any) {
      this._logger.forBot().error('Failed to list integrations: ' + error.message, error?.response?.data)
      throw new sdk.RuntimeError('Failed to list integrations: ' + error.message)
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
      throw new sdk.RuntimeError(`Failed to pass control to switchboard: ${errorMessage}`)
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
      throw new sdk.RuntimeError(`Failed to release control from switchboard: ${errorMessage}`)
    }
  }
}

export const getSuncoClient = (config: SuncoConfiguration, logger: bp.Logger) => new SuncoClient(config, logger)
