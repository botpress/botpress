import * as sdk from '@botpress/sdk'
import axios, { type Axios } from 'axios'
import type {
  FreshchatMessage,
  FreshchatAgent,
  FreshchatChannel,
  FreshchatConfiguration,
  FreshchatUser,
} from './definitions/schemas'
import * as bp from '.botpress'

// API docs: https://developers.freshchat.com/api/

class FreshchatClient {
  private _client: Axios

  public constructor(
    private _config: FreshchatConfiguration,
    private _logger: bp.Logger
  ) {
    this._client = axios.create({
      baseURL: `https://${this._config.domain}.freshchat.com/v2`,
    })

    this._client.interceptors.request.use((axionsConfig) => {
      // @ts-ignore
      axionsConfig.headers = {
        ...axionsConfig.headers,
        Authorization: 'Bearer ' + this._config.token,
      }
      return axionsConfig
    })
  }

  public async createConversation(args: {
    userId: string
    messages: FreshchatMessage[]
    channelId: string
  }): Promise<{ conversation_id: string; channel_id: string }> {
    const { data } = await this._client.post('/conversations', {
      channel_id: args.channelId,
      messages: args.messages,
      users: [
        {
          id: args.userId,
        },
      ],
    })
    return data
  }

  public async setConversationAsResolved(freshchatConversationId: string) {
    await this._client.put(`/conversations/${freshchatConversationId}`, {
      status: 'resolved',
    })
  }

  public async sendMessage(fromUserId: string | null, freshchatConversationId: string, message: string) {
    const response = await this._client.post<FreshchatMessage & { id: string }>(
      `/conversations/${freshchatConversationId}/messages`,
      {
        message_parts: [{ text: { content: message } }],
        message_type: 'normal',
        user_id: fromUserId,
        actor_type: fromUserId?.length ? 'user' : 'system',
        actor_id: fromUserId,
      }
    )

    const messageId = response.data.id

    if (!messageId) {
      throw new sdk.RuntimeError('Failed to send message')
    }

    return messageId
  }

  public async getOrCreateUser(props: {
    name?: string
    email?: string
    pictureUrl?: string
    botpressUserId: string
  }): Promise<FreshchatUser> {
    let user = await this._getUserByReferenceId(props.botpressUserId)

    if (!user) {
      user = await this._getUserByEmail(props.email)
    }

    if (!user) {
      user = await this._createUser(props)
    }

    return user
  }

  private async _getUserByEmail(email?: string): Promise<FreshchatUser | undefined> {
    if (!email) {
      return undefined
    }
    try {
      const result = await this._client.get('/users?email=' + email)
      return result?.data?.users[0]
    } catch (e: any) {
      this._logger.forBot().error('Failed to get user by email: ' + email, e.message, e?.response?.data)
      throw new sdk.RuntimeError('Failed to get user by email ' + e.message)
    }
  }

  private async _getUserByReferenceId(referenceId: string): Promise<FreshchatUser | undefined> {
    try {
      const result = await this._client.get('/users?reference_id=' + referenceId)
      return result?.data?.users[0]
    } catch (e: any) {
      this._logger.forBot().error('Failed to get user by reference_id: ' + referenceId, e.message, e?.response?.data)
      throw new sdk.RuntimeError('Failed to get user by reference_id ' + e.message)
    }
  }

  private async _createUser(props: {
    name?: string
    email?: string
    pictureUrl?: string
    botpressUserId: string
  }): Promise<FreshchatUser> {
    const result = await this._client.post('/users', {
      email: props.email,
      first_name: props.name,
      reference_id: props.botpressUserId,
      avatar: { url: props.pictureUrl },
    })
    return result.data
  }

  public async getChannels(): Promise<FreshchatChannel[]> {
    try {
      const result = await this._client.get<{ channels: FreshchatChannel[] }>('/channels?items_per_page=9999')
      return result?.data?.channels
    } catch (e: any) {
      this._logger.forBot().error('Failed to get channels : ' + e.message, e?.response?.data)
      throw new sdk.RuntimeError('Failed to get channels: ' + e.message)
    }
  }

  public async verifyToken(): Promise<boolean> {
    try {
      const result = await this._client.get<{ organisation_id: number }>('/accounts/configuration')
      return !!result?.data?.organisation_id
    } catch {
      return false
    }
  }

  public async getAgentById(id: string): Promise<FreshchatAgent | undefined> {
    try {
      const result = await this._client.get('/agents/' + id)
      return result?.data
    } catch (e: any) {
      this._logger.forBot().error('Failed to get user by id: ' + id, e.message, e?.response?.data)
      throw e
    }
  }
}

export const getFreshchatClient = (config: FreshchatConfiguration, logger: bp.Logger) =>
  new FreshchatClient(config, logger)
