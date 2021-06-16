import axios from 'axios'

export class MessagingClient {
  public baseUrl = 'http://localhost:3100'
  private apiUrl = `${this.baseUrl}/api`

  constructor(private clientId: string, private clientToken: string, public providerName: string) {}

  async setupClient(config: any) {
    const res = await axios.post(`${this.apiUrl}/sync`, config)
    return res.data
  }

  async sendMessage(conversationId: string, channel: string, payload: any) {
    await axios.post(
      `${this.apiUrl}/messages/send`,
      {
        conversationId,
        channel,
        payload
      },
      { auth: { username: this.clientId, password: this.clientToken } }
    )
  }

  async getProvider(name: string) {
    try {
      const res = await axios.get(`${this.apiUrl}/providers`, { params: { name } })
      return res.data
    } catch {
      return undefined
    }
  }

  async createProvider(name: string) {
    const res = await axios.post(`${this.apiUrl}/providers`, { name })
    return res.data
  }

  async createClient(providerId: string) {
    const res = await axios.post(`${this.apiUrl}/clients`, { providerId })
    return res.data
  }

  async createConduit(providerId: string, channel: string, config: any) {
    const res = await axios.post(`${this.apiUrl}/conduits`, { providerId, channel, config })
    return res.data
  }
}
