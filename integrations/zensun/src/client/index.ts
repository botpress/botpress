import * as SunshineConversationsClient from 'sunshine-conversations-client'

const defaultClient = SunshineConversationsClient.ApiClient.instance

export class ZensunApi {
  private client: typeof defaultClient
  private appId: string

  constructor(appId: string, keyId: string, keySecret: string) {
    this.appId = appId
    this.client = new SunshineConversationsClient.ApiClient()
    const auth = this.client.authentications['basicAuth']
    auth.username = keyId
    auth.password = keySecret
  }

  async createIntegration(integrationData: {
    type?: string
    displayName?: string
    webhooks: {
      target: string
      triggers: string[]
    }[]
  }) {
    integrationData.type = integrationData.type ?? 'custom'
    const apiInstance = new SunshineConversationsClient.IntegrationsApi(
      this.client
    )
    const integration =
      SunshineConversationsClient.Integration.constructFromObject(
        integrationData,
        new SunshineConversationsClient.Integration(integrationData.type)
      )
    integration.webhooks = integrationData.webhooks
    const result = await apiInstance.createIntegration(this.appId, integration)
    return result
  }

  async listIntegrations(opts: {
    page: SunshineConversationsClient.Page
    filter: SunshineConversationsClient.IntegrationListFilter
  }) {
    const apiInstance = new SunshineConversationsClient.IntegrationsApi(
      this.client
    )
    const result = await apiInstance.listIntegrations(this.appId, opts)
    return result
  }

  async getOrCreateIntegrationId(
    displayName: string,
    webhookData: { target: string; triggers: string[] }
  ) {
    const integrations = await this.listIntegrations({
      page: new SunshineConversationsClient.Page(),
      filter: new SunshineConversationsClient.IntegrationListFilter(),
    })
    let integration = integrations.integrations.find(
      (integration: SunshineConversationsClient.Integration) =>
        integration.displayName === displayName
    )
    if (!integration) {
      try {
        const response = await this.createIntegration({
          type: 'custom',
          displayName,
          webhooks: [webhookData],
        })
        integration = response.integration
      } catch (error) {
        console.log(JSON.stringify(error))
      }
    }
    return integration.id
  }

  async deleteIntegration(integrationId: string) {
    const apiInstance = new SunshineConversationsClient.IntegrationsApi(
      this.client
    )
    const result = await apiInstance.deleteIntegration(
      this.appId,
      integrationId
    )
    return result
  }

  async createWebhook(
    webhookData: { target: string; triggers: string[] },
    integrationId: string
  ) {
    const apiInstance = new SunshineConversationsClient.WebhooksApi(this.client)
    const webhookCreateBody = new SunshineConversationsClient.WebhookCreateBody(
      webhookData.target,
      webhookData.triggers
    )
    const result = await apiInstance.createWebhook(
      this.appId,
      integrationId,
      webhookCreateBody
    )
    return result
  }

  async deleteWebhook(webhookId: string, integrationId: string) {
    const apiInstance = new SunshineConversationsClient.WebhooksApi(this.client)
    const result = await apiInstance.deleteWebhook(
      this.appId,
      integrationId,
      webhookId
    )
    return result
  }

  async createConversation(conversationData: {
    type: string
    participants?: {
      userId?: string
      userExternalId?: string
      subscribeSDKClient?: boolean
    }[]
    displayName?: string
    description?: string
    iconUrl?: string
    metadata?: object
  }) {
    const apiInstance = new SunshineConversationsClient.ConversationsApi(
      this.client
    )
    const conversationCreateBody =
      SunshineConversationsClient.ConversationCreateBody.constructFromObject(
        conversationData,
        new SunshineConversationsClient.ConversationCreateBody(
          conversationData.type
        )
      )
    const result = await apiInstance.createConversation(
      this.appId,
      conversationCreateBody
    )
    return result.conversation
  }

  async listConversations(
    filter: {
      userId?: string
      userExternalId?: string
    },
    page?: {
      after?: string
      before?: string
      size?: number
    }
  ) {
    const apiInstance = new SunshineConversationsClient.ConversationsApi(
      this.client
    )
    const filterObj =
      SunshineConversationsClient.ConversationListFilter.constructFromObject(
        filter,
        new SunshineConversationsClient.ConversationListFilter()
      )
    const pageObj = SunshineConversationsClient.Page.constructFromObject(
      page,
      new SunshineConversationsClient.Page()
    )
    const result = await apiInstance.listConversations(this.appId, filterObj, {
      page: pageObj,
    })
    return result
  }

  async getOrCreateConversation(conversationData: {
    type: string
    participants?: {
      userExternalId?: string
    }[]
    displayName?: string
    description?: string
    iconUrl?: string
    metadata?: object
  }) {
    try {
      const filter =
        conversationData.participants && conversationData.participants[0]
          ? {
              userExternalId:
                conversationData.participants[0]?.userExternalId || undefined,
            }
          : {}
      const result = await this.listConversations(filter)
      if (result.conversations && result.conversations.length > 0) {
        return result.conversations[0]
      } else {
        const result = await this.createConversation(conversationData)
        return result
      }
    } catch (error) {
      throw error
    }
  }

  async getUser(userIdOrExternalId: string) {
    const apiInstance = new SunshineConversationsClient.UsersApi(this.client)
    const result = await apiInstance.getUser(this.appId, userIdOrExternalId)
    return result
  }

  async createUser(userData: {
    externalId: string
    signedUpAt?: string
    profile?: {
      givenName?: string
      surname?: string
      email?: string
      avatarUrl?: string
      locale?: string
    }
    metadata?: object
  }) {
    const apiInstance = new SunshineConversationsClient.UsersApi(this.client)

    const userCreateBody =
      SunshineConversationsClient.UserCreateBody.constructFromObject(
        userData,
        new SunshineConversationsClient.UserCreateBody(userData.externalId)
      )
    const result = await apiInstance.createUser(this.appId, userCreateBody)
    return result
  }

  async getOrCreateUser(userData: {
    externalId: string
    signedUpAt?: string
    profile?: {
      givenName?: string
      surname?: string
      email?: string
      avatarUrl?: string
      locale?: string
    }
    metadata?: object
  }) {
    try {
      const result = await this.getUser(userData.externalId)
      return result
    } catch (error) {
      if ((error as { status: number }).status === 404) {
        const result = await this.createUser(userData)
        return result
      } else {
        throw error
      }
    }
  }

  async joinConversation(
    conversationId: string,
    participantData: {
      userId?: string
      userExternalId?: string
      subscribeSDKClient?: boolean
    }
  ) {
    const apiInstance = new SunshineConversationsClient.ParticipantsApi(
      this.client
    )
    const participantJoinBody =
      SunshineConversationsClient.ParticipantJoinBody.constructFromObject(
        participantData,
        new SunshineConversationsClient.ParticipantJoinBody()
      )
    const result = await apiInstance.joinConversation(
      this.appId,
      conversationId,
      participantJoinBody
    )
    return result
  }

  async listParticipant(
    conversationId: string,
    paginationOptions?: {
      after?: string
      before?: string
      size?: number
    }
  ) {
    const apiInstance = new SunshineConversationsClient.ParticipantsApi(
      this.client
    )
    const page = SunshineConversationsClient.Page.constructFromObject(
      paginationOptions,
      new SunshineConversationsClient.Page()
    )
    const opts = {
      page,
    }
    const result = await apiInstance.listParticipants(
      this.appId,
      conversationId,
      opts
    )
    return result
  }

  async listMessages(
    conversationId: string,
    paginationOptions?: SunshineConversationsClient.Page
  ) {
    const apiInstance = new SunshineConversationsClient.MessagesApi(this.client)
    const page = SunshineConversationsClient.Page.constructFromObject(
      paginationOptions || {},
      new SunshineConversationsClient.Page()
    )
    const opts = {
      page,
    }
    const result = await apiInstance.listMessages(
      this.appId,
      conversationId,
      opts
    )
    return result
  }

  async postMessage(
    conversationId: string,
    messageData: {
      author: {
        type: string
        userId?: string
        userExternalId?: string
        displayName?: string
        avatarUrl?: string
      }
      content: {
        type: string
        text?: string
        actions?: any[]
        payload?: string
      }
      destination?: {
        integrationId?: string
      }
      metadata?: object
      override?: any
    }
  ) {
    const apiInstance = new SunshineConversationsClient.MessagesApi(this.client)
    const messagePost =
      SunshineConversationsClient.MessagePost.constructFromObject(
        messageData,
        new SunshineConversationsClient.MessagePost(
          messageData.author,
          messageData.content
        )
      )
    const result = await apiInstance.postMessage(
      this.appId,
      conversationId,
      messagePost
    )
    return result
  }

  async postMessageSafe(
    conversationId: string,
    messageData: {
      author: {
        type: string
        userId?: string
        userExternalId?: string
        displayName?: string
        avatarUrl?: string
      }
      content: {
        type: string
        text?: string
        actions?: any[]
        payload?: string
      }
      destination?: {
        integrationId?: string
      }
      metadata?: object
      override?: any
    }
  ) {
    const response = await this.listMessages(conversationId)
    if (response.messages.length > 0) {
      const lastMessage = response.messages[response.messages.length - 1]
      if (
        !(
          lastMessage.metadata &&
          lastMessage.metadata.userExternalId ===
            messageData.author.userExternalId &&
          lastMessage.content.text === messageData.content.text
        )
      ) {
        return await this.postMessage(conversationId, messageData)
      }
    }
    return { messages: [] }
  }
}
