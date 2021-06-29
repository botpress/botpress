import Axios, { AxiosInstance } from 'axios'

export class MessagingClient {
  private apiUrl: string
  private axios: AxiosInstance

  constructor(
    public baseUrl: string,
    private password: string,
    private clientId: string,
    private clientToken: string,
    public providerName: string
  ) {
    this.apiUrl = `${this.baseUrl}/api`
    this.axios = Axios.create({
      headers: { password: this.password },
      auth: { username: this.clientId, password: this.clientToken }
    })
  }

  async createConversation(userId: string): Promise<Conversation> {
    const res = await this.axios.post(`${this.apiUrl}/conversations`, { userId })
    return res.data
  }
}

export type uuid = string

export interface Conversation {
  id: uuid
  clientId: uuid
  userId: uuid
  createdOn: Date
}

export interface Message {
  id: uuid
  conversationId: uuid
  authorId: uuid | undefined
  sentOn: Date
  payload: any
}

export interface RecentConversation extends Conversation {
  lastMessage?: Message
}
