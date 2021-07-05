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

  async getConversationById(id: uuid): Promise<Conversation> {
    const res = await this.axios.get(`${this.apiUrl}/conversations/${id}`)
    return res.data
  }

  async listConversations(userId: string, limit: number): Promise<Conversation[]> {
    const res = await this.axios.get(`${this.apiUrl}/conversations`, { params: { userId, limit } })
    return res.data
  }

  async getMostRecentConversationForUser(userId: string): Promise<Conversation> {
    const res = await this.axios.get(`${this.apiUrl}/conversations/${userId}/recent`)
    return res.data
  }

  async createMessage(conversationId: uuid, authorId: string, payload: any): Promise<Message> {
    const res = await this.axios.post(`${this.apiUrl}/messages`, { conversationId, authorId, payload })
    return res.data
  }

  async listMessages(conversationId: uuid, limit: number): Promise<Message[]> {
    const res = await this.axios.get(`${this.apiUrl}/messages`, { params: { conversationId, limit } })
    return res.data
  }

  async deleteMessages(conversationId: uuid): Promise<void> {
    const res = await this.axios.delete(`${this.apiUrl}/messages`, { params: { conversationId } })
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
