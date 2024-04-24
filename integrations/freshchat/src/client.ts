import axios, { Axios, AxiosError } from 'axios'
import { FreshchatConfiguration, FreshchatUser } from './definitions/schemas'
import * as console from 'node:console'
import { FreshchatConversation } from './definitions/schemas'

class FreshchatClient {
  private client: Axios

  constructor(private config: FreshchatConfiguration) {
    this.client = axios.create({
      baseURL: `https://${this.config.domain}.freshchat.com/v2`
    })

    this.client.interceptors.request.use((axionsConfig) => {
      axionsConfig.headers = {
        Authorization: 'Bearer ' + this.config.token
      }
      return axionsConfig
    })
  }

  public async createConversation(args: { userId: string; transcript: string }): Promise<{conversation_id: string; channel_id: string}> {
    const { data } = await this.client.post('/conversations', {
      channel_id: this.config.channel_id,
      messages: [
        {
          message_parts: [{
            text: {
              content: args.transcript?.length ? args.transcript : '--No transcript supplied--'
            }
          }],
          channel_id: this.config.channel_id,
          message_type: 'normal',
          actor_type: 'user',
          actor_id: args.userId
        }
      ],
      users: [{
        id: args.userId
      }]
    })
    return data
  }

  public async updateConversation(conversationId: string, args: {
    status: 'new' | 'assigned' | 'resolved' | 'reopened',
    assigned_group_id?: string,
    assigned_agent_id?: string,
    channel_id?: string,
    properties?: {
      // cf_
      [key: string]: string;
    }
  }): Promise<{ success: boolean, message?: string, data?: FreshchatConversation }> {
    try {
      const { data } = await this.client.put(`/conversations/${conversationId}`, args)
      return { success: true, data };
    } catch (error: any) {
      console.log('error updating conversation', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }

  public async sendMessage(fromUserId: string, freshchatConversationId: string, message: string) {
    await this.client.post(`/conversations/${freshchatConversationId}/messages`, {
      message_parts: [
        { text: { 'content': message } }
      ],
      message_type: 'normal',
      user_id: fromUserId,
      actor_type: 'user',
      actor_id: fromUserId
    })
  }

  public async getUserByEmail(email: string): Promise<FreshchatUser | undefined> {
    try {
      const result = await this.client.get('/users?email=' + email)
      console.log('got result', result, result.data)
      return result?.data?.users[0]
    } catch(e: any) {
      console.log('Failed to get user by email: ' + email, e.message, e?.response?.data, this.client.defaults.baseURL, this.config)
      throw e
    }
  }

  public async createUser(newUser: FreshchatUser): Promise<FreshchatUser> {
    const result = await this.client.post('/users', newUser)
    return result.data
  }
}

export const getFreshchatClient = (config: FreshchatConfiguration) => new FreshchatClient(config)
