import get from 'lodash/get'

export default class WebchatApi {
  private axios
  private axiosConfig
  private userId: string
  private botId: string

  constructor(userId: string, axiosInstance) {
    this.userId = userId
    this.axios = axiosInstance
    this.axios.interceptors.request.use(
      config => {
        const prefix = config.url.indexOf('?') > 0 ? '&' : '?'
        config.url += prefix + '__ts=' + new Date().getTime()
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    this.axiosConfig = this.updateAxiosConfig()
  }

  updateUserId(userId) {
    this.userId = userId
  }

  updateAxiosConfig({ botId = undefined, externalAuthToken = undefined } = {}) {
    this.botId = botId
    this.axiosConfig = botId
      ? { baseURL: `${window.location.origin}/api/v1/bots/${botId}/mod/channel-web` }
      : { baseURL: `${window.BOT_API_PATH}/mod/channel-web` }

    if (externalAuthToken) {
      this.axiosConfig = {
        ...this.axiosConfig,
        headers: {
          ExternalAuth: `Bearer ${externalAuthToken}`,
          'X-BP-ExternalAuth': `Bearer ${externalAuthToken}`
        }
      }
    }
  }

  async fetchBotInfo() {
    try {
      const { data } = await this.axios.get('/botInfo', this.axiosConfig)
      return data
    } catch (err) {
      console.log(`Error while loading bot info`, err)
    }
  }

  async fetchConversations() {
    try {
      const { data } = await this.axios.get(`/conversations/${this.userId}`, this.axiosConfig)
      return data
    } catch (err) {
      console.log(`Error while fetching convos`, err)
    }
  }

  async fetchConversation(convoId: number) {
    try {
      const { data } = await this.axios.get(`/conversations/${this.userId}/${convoId}`, this.axiosConfig)
      return data
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async resetSession(convoId: number) {
    try {
      this.axios.post(`/conversations/${this.userId}/${convoId}/reset`, {}, this.axiosConfig)
    } catch (err) {
      console.log(`Error while reseting convo`, err)
    }
  }

  async createConversation(): Promise<number> {
    try {
      const { data } = await this.axios.post(`/conversations/${this.userId}/new`, {}, this.axiosConfig)
      return data.convoId
    } catch (err) {
      console.log(`Error in create conversation`, err)
    }
  }

  async downloadConversation(convoId: number): Promise<any> {
    try {
      const { data } = await this.axios.get(`/conversations/${this.userId}/${convoId}/download/txt`, this.axiosConfig)
      return { name: data.name, txt: data.txt }
    } catch (err) {
      console.log(`Error in download convo`, err)
    }
  }

  async sendEvent(data: any): Promise<void> {
    try {
      return this.axios.post(`/events/${this.userId}`, data, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async sendMessage(data: any, convoId: number): Promise<void> {
    try {
      const config = { params: { conversationId: convoId }, ...this.axiosConfig }
      return this.axios.post(`/messages/${this.userId}`, data, config)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async uploadFile(data: any, convoId: number): Promise<void> {
    try {
      const config = { params: { conversationId: convoId }, ...this.axiosConfig }
      return this.axios.post(`/messages/${this.userId}/files`, data, config)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  handleApiError = async error => {
    // @deprecated 11.9 (replace with proper error management)
    const data = get(error, 'response.data', {})
    if (data && typeof data === 'string' && data.includes('BP_CONV_NOT_FOUND')) {
      console.log('Conversation not found, starting a new one...')
      await this.createConversation()
    }

    if (data.errorCode === 'BP_0401') {
      this.updateAxiosConfig({ botId: this.botId, externalAuthToken: undefined })
      console.log(`External token expired or invalid. Removed from future requests`)
    }
  }
}
