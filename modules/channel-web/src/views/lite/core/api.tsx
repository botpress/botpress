import { EventFeedback } from 'lite/typings'
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
        if (!config.url.includes('/botInfo')) {
          const prefix = config.url.indexOf('?') > 0 ? '&' : '?'
          config.url = `${config.url}${prefix}__ts=${new Date().getTime()}`
        }
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    this.axiosConfig = this.updateAxiosConfig()
  }

  private get baseUserPayload() {
    return {
      webSessionId: window.__BP_VISITOR_SOCKET_ID
    }
  }

  updateUserId(userId: string) {
    this.userId = userId
  }

  updateAxiosConfig({ botId = undefined, externalAuthToken = undefined } = {}) {
    this.botId = botId
    this.axiosConfig = botId
      ? { baseURL: `${window.location.origin}${window.BOT_API_PATH}/mod/channel-web` }
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
      console.error('Error while loading bot info', err)
    }
  }

  async fetchPreferences() {
    try {
      const { data } = await this.axios.post('/preferences/get', this.baseUserPayload, this.axiosConfig)
      return data
    } catch (err) {
      console.error('Error while fetching preferences', err)
    }
  }

  async updateUserPreferredLanguage(language: string) {
    try {
      await this.axios.post('/preferences', { ...this.baseUserPayload, language }, this.axiosConfig)
    } catch (err) {
      console.error('Error in updating user preferred language', err)
    }
  }

  async fetchConversations() {
    try {
      const { data } = await this.axios.post('/conversations/list', this.baseUserPayload, this.axiosConfig)
      return data
    } catch (err) {
      console.error('Error while fetching convos', err)
    }
  }

  async fetchConversation(conversationId: number) {
    try {
      const { data } = await this.axios.post(
        '/conversations/get',
        { ...this.baseUserPayload, conversationId },
        this.axiosConfig
      )
      return data
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async resetSession(conversationId: number) {
    try {
      this.axios.post('/conversations/reset', { ...this.baseUserPayload, conversationId }, this.axiosConfig)
    } catch (err) {
      console.error('Error while resetting convo', err)
    }
  }

  async createConversation(): Promise<number> {
    try {
      const { data } = await this.axios.post('/conversations/new', this.baseUserPayload, this.axiosConfig)
      return data.convoId
    } catch (err) {
      console.error('Error in create conversation', err)
    }
  }

  async downloadConversation(conversationId: number): Promise<any> {
    try {
      const { data } = await this.axios.post(
        '/conversations/download/txt',
        { ...this.baseUserPayload, conversationId },
        this.axiosConfig
      )
      return { name: data.name, txt: data.txt }
    } catch (err) {
      console.error('Error in download convo', err)
    }
  }

  async sendEvent(payload: any, conversationId: number): Promise<void> {
    try {
      return this.axios.post('/events', { ...this.baseUserPayload, conversationId, payload }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async sendMessage(payload: any, conversationId: number): Promise<void> {
    try {
      return this.axios.post('/messages', { ...this.baseUserPayload, conversationId, payload }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async deleteMessages(conversationId: number) {
    try {
      await this.axios.post(
        '/conversations/messages/delete',
        { ...this.baseUserPayload, conversationId },
        this.axiosConfig
      )
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async sendFeedback(feedback: number, eventId: string): Promise<void> {
    try {
      return this.axios.post('/saveFeedback', { eventId, target: this.userId, feedback }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async getEventIdsFeedbackInfo(eventIds: string[]): Promise<EventFeedback[]> {
    try {
      const { data } = await this.axios.post('/feedbackInfo', { eventIds, target: this.userId }, this.axiosConfig)
      return data
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async uploadFile(data: any, conversationId: number): Promise<void> {
    try {
      return this.axios.post('/messages/files', { ...this.baseUserPayload, conversationId, ...data }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async setReference(reference: string, conversationId: number): Promise<void> {
    try {
      return this.axios.post(
        '/conversations/reference',
        { ...this.baseUserPayload, conversationId, reference },
        this.axiosConfig
      )
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  handleApiError = async error => {
    // @deprecated 11.9 (replace with proper error management)
    const data = get(error, 'response.data', {})
    if (data && typeof data === 'string' && data.includes('BP_CONV_NOT_FOUND')) {
      console.error('Conversation not found, starting a new one...')
      await this.createConversation()
    }

    if (data.errorCode === 'BP_0401') {
      this.updateAxiosConfig({ botId: this.botId, externalAuthToken: undefined })
      console.error('External token expired or invalid. Removed from future requests')
    }
  }
}
