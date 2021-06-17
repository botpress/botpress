import axios from 'axios'

export class MessagingClient {
  public baseUrl = 'http://localhost:3100'
  private apiUrl = `${this.baseUrl}/api`

  constructor(private clientId: string, private clientToken: string, public providerName: string) {}

  async syncClient(config: any) {
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
}
