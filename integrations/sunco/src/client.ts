import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { BASE_HEADERS } from './api/const'
import {
  SunshineConversationsApi,
  type AppsApi,
  type UsersApi,
  type ConversationsApi,
  type MessagesApi,
  type ActivitiesApi,
  type WebhooksApi,
  type PostMessageRequest,
  type ActivityPost,
} from './api/sunshine-api'
import { StoredCredentials } from './types'

class SuncoClient {
  private _appId: string
  private _credentials: StoredCredentials
  private _client: {
    apps: AppsApi
    users: UsersApi
    conversations: ConversationsApi
    messages: MessagesApi
    activities: ActivitiesApi
    webhooks: WebhooksApi
  }

  public constructor(credentials: StoredCredentials) {
    this._appId = credentials.appId
    this._credentials = credentials
    const apiClient = new SunshineConversationsApi.ApiClient()

    if (credentials.configType === 'manual') {
      const auth = apiClient.authentications['basicAuth']
      auth.username = credentials.keyId
      auth.password = credentials.keySecret
    } else {
      if (!credentials.subdomain) {
        throw new RuntimeError('Subdomain is required for OAuth')
      }
      apiClient.basePath = `https://${credentials.subdomain}.zendesk.com/sc`
      const auth = apiClient.authentications['bearerAuth'] as { accessToken: string }
      auth.accessToken = credentials.token
      apiClient.defaultHeaders = { ...apiClient.defaultHeaders, ...BASE_HEADERS }
    }

    this._client = {
      apps: new SunshineConversationsApi.AppsApi(apiClient),
      users: new SunshineConversationsApi.UsersApi(apiClient),
      conversations: new SunshineConversationsApi.ConversationsApi(apiClient),
      messages: new SunshineConversationsApi.MessagesApi(apiClient),
      activities: new SunshineConversationsApi.ActivitiesApi(apiClient),
      webhooks: new SunshineConversationsApi.WebhooksApi(apiClient),
    }
  }

  public async getApp() {
    return this._client.apps.getApp(this._appId)
  }

  public async getUser(userId: string) {
    return this._client.users.getUser(this._appId, userId)
  }

  public async getConversation(conversationId: string) {
    return this._client.conversations.getConversation(this._appId, conversationId)
  }

  public async postMessage(conversationId: string, messagePost: PostMessageRequest) {
    return this._client.messages.postMessage(this._appId, conversationId, messagePost)
  }

  public async postActivity(conversationId: string, activityPost: ActivityPost) {
    return this._client.activities.postActivity(this._appId, conversationId, activityPost)
  }

  public async listWebhooks() {
    const result = await this._client.webhooks.listWebhooks(this._appId, 'me')
    return result.webhooks || []
  }

  public async createWebhook(webhookUrl: string) {
    const result = await this._client.webhooks.createWebhook(this._appId, 'me', {
      target: webhookUrl,
      triggers: ['conversation:message', 'conversation:postback', 'conversation:create'],
    })
    return result.webhook
  }

  public async updateWebhook(webhookId: string, webhookUrl: string) {
    const result = await this._client.webhooks.updateWebhook(this._appId, 'me', webhookId, {
      target: webhookUrl,
      triggers: ['conversation:message', 'conversation:postback', 'conversation:create'],
    })
    return result.webhook
  }

  public async deleteWebhook(webhookId: string) {
    await this._client.webhooks.deleteWebhook(this._appId, 'me', webhookId)
  }

  public async downloadAndUploadAttachment(sourceUrl: string, conversationId: string): Promise<string> {
    const response = await axios.get(sourceUrl, { responseType: 'arraybuffer' })

    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const fileBuffer = Buffer.from(response.data)
    const filename = new URL(sourceUrl).pathname.split('/').pop() || 'file'

    const formData = new FormData()
    formData.append('source', new Blob([fileBuffer], { type: contentType }), filename)

    // Upload via axios instead of the SDK because the sunshine-conversations-client SDK
    // uses superagent internally, which doesn't properly handle Node.js File/Blob objects.
    const credentials = this._credentials
    const auth =
      credentials.configType === 'manual'
        ? { auth: { username: credentials.keyId, password: credentials.keySecret } }
        : { headers: { Authorization: `Bearer ${credentials.token}` } }

    const baseUrl =
      credentials.configType === 'manual' ? 'https://api.smooch.io' : `https://${credentials.subdomain}.zendesk.com/sc`

    const uploadResponse = await axios.postForm(`${baseUrl}/v2/apps/${this._appId}/attachments`, formData, {
      params: { access: 'public', for: 'message', conversationId },
      ...auth,
    })

    const mediaUrl = uploadResponse.data?.attachment?.mediaUrl
    if (!mediaUrl) {
      throw new RuntimeError('Failed to upload attachment to Zendesk: no mediaUrl returned')
    }

    return mediaUrl
  }
}

export const getSuncoClient = (credentials: StoredCredentials) => new SuncoClient(credentials)
export type { SuncoClient }
