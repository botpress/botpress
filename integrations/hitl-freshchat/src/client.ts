import axios, { Axios } from 'axios'
import * as bp from '.botpress'
import { FreshchatAgent, FreshchatConfiguration, FreshchatUser } from './definitions/schemas'

class FreshchatClient {
  private client: Axios

  public constructor(private _config: FreshchatConfiguration, private _logger: bp.Logger) {
    this.client = axios.create({
      baseURL: `https://${this._config.domain}.freshchat.com/v2`
    })

    this.client.interceptors.request.use((axionsConfig) => {
      // @ts-ignore
      axionsConfig.headers = {
        ...axionsConfig.headers,
        Authorization: 'Bearer ' + this._config.token
      }
      return axionsConfig
    })
  }

  public async createConversation(args: { userId: string; messages: any[] }): Promise<{conversation_id: string; channel_id: string}> {
    const { data } = await this.client.post('/conversations', {
      channel_id: this._config.channel_id,
      messages: args.messages,
      users: [{
        id: args.userId
      }]
    })
    return data
  }

  public async sendMessage(fromUserId: string | null, freshchatConversationId: string, message: string) {
    await this.client.post(`/conversations/${freshchatConversationId}/messages`, {
      message_parts: [
        { text: { 'content': message } }
      ],
      message_type: 'normal',
      user_id: fromUserId,
      actor_type: fromUserId?.length ? 'user' : 'system',
      actor_id: fromUserId
    })
  }

  public async getUserByEmail(email: string): Promise<FreshchatUser | undefined> {
    try {
      const result = await this.client.get('/users?email=' + email)
      return result?.data?.users[0]
    } catch(e: any) {
      this._logger.forBot().error('Failed to get user by email: ' + email, e.message, e?.response?.data, this.client.defaults.baseURL, this._config)
      throw e
    }
  }

  public async getAgentById(id: string): Promise<FreshchatAgent | undefined> {
    try {
      const result = await this.client.get('/agents/' + id)
      return result?.data
    } catch(e: any) {
      this._logger.forBot().error('Failed to get user by id: ' + id, e.message, e?.response?.data)
      throw e
    }
  }

  public async createUser(newUser: FreshchatUser): Promise<FreshchatUser> {
    const result = await this.client.post('/users', newUser)
    return result.data
  }
}

export const getFreshchatClient = (config: FreshchatConfiguration, logger: bp.Logger) => new FreshchatClient(config, logger)
