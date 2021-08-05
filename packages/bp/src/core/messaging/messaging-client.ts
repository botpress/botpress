import axios, { AxiosRequestConfig } from 'axios'

interface MessagingSyncWebHookResponse {
  url: string
  token: string
}

interface MessagingSyncResponse {
  id: string
  token: string
  webhooks?: MessagingSyncWebHookResponse[]
}

export class MessagingClient {
  private apiUrl: string

  constructor(
    public baseUrl: string,
    private password?: string,
    private clientId?: string,
    private clientToken?: string
  ) {
    this.apiUrl = `${this.baseUrl}/api`
  }

  async syncClient(config: any) {
    const res = await axios.post<MessagingSyncResponse>(`${this.apiUrl}/sync`, config, this.getAxiosConfig())
    return res.data
  }

  async sendMessage(conversationId: string, channel: string, payload: any) {
    await axios.post(
      `${this.apiUrl}/chat/reply`,
      {
        conversationId,
        channel,
        payload
      },
      this.getAxiosConfig(true)
    )
  }

  private getAxiosConfig(auth: boolean = false): AxiosRequestConfig {
    const config: AxiosRequestConfig = { headers: {} }

    if (this.password) {
      config.headers.password = this.password
    }

    if (auth) {
      config.headers['x-bp-messaging-client-id'] = this.clientId!
      config.headers['x-bp-messaging-client-token'] = this.clientToken!
    }

    return config
  }
}
