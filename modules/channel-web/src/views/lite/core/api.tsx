import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { EventFeedback } from 'lite/typings'
import get from 'lodash/get'
import uuidgen from 'uuid'
import { uuid } from '../typings'

export default class WebchatApi {
  private axios: AxiosInstance
  private axiosConfig: AxiosRequestConfig
  private botId: string

  constructor(axiosInstance: AxiosInstance) {
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

    this.updateAxiosConfig()
  }

  private get baseUserPayload() {
    return {
      webSessionId: window.__BP_VISITOR_SOCKET_ID
    }
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

  async setCustomUserId(userId: string) {
    try {
      await this.axios.post('/users/customId', { ...this.baseUserPayload, customId: userId }, this.axiosConfig)
    } catch (err) {
      console.error('Error while setting a custom user id', err)
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

  async fetchConversation(conversationId: uuid) {
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

  async resetSession(conversationId: uuid): Promise<void> {
    try {
      await this.axios.post('/conversations/reset', { ...this.baseUserPayload, conversationId }, this.axiosConfig)
    } catch (err) {
      console.error('Error while resetting conversation', err)
    }
  }

  async createConversation(): Promise<uuid> {
    try {
      const { data } = await this.axios.post('/conversations/new', this.baseUserPayload, this.axiosConfig)
      return data.convoId
    } catch (err) {
      console.error('Error in create conversation', err)
    }
  }

  async downloadConversation(conversationId: uuid): Promise<any> {
    try {
      const { data } = await this.axios.post(
        '/conversations/download/txt',
        { ...this.baseUserPayload, conversationId },
        this.axiosConfig
      )
      return { name: data.name, txt: data.txt }
    } catch (err) {
      console.error('Error in download conversation', err)
    }
  }

  async sendEvent(payload: any, conversationId: uuid): Promise<void> {
    try {
      return this.axios.post('/events', { ...this.baseUserPayload, conversationId, payload }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async sendMessage(payload: any, conversationId: uuid): Promise<void> {
    try {
      return this.axios.post('/messages', { ...this.baseUserPayload, conversationId, payload }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async deleteMessages(conversationId: uuid) {
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

  async sendFeedback(feedback: number, messageId: uuid): Promise<void> {
    try {
      return this.axios.post('/saveFeedback', { messageId, target: window.__BP_VISITOR_ID, feedback }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async getMessageIdsFeedbackInfo(messageIds: uuid[]): Promise<EventFeedback[]> {
    try {
      const { data } = await this.axios.post(
        '/feedbackInfo',
        { messageIds, target: window.__BP_VISITOR_ID },
        this.axiosConfig
      )
      return data
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async uploadFile(file: File, payload: string, conversationId: uuid): Promise<void> {
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('webSessionId', this.baseUserPayload.webSessionId)
      data.append('conversationId', conversationId)
      data.append('payload', payload)

      return this.axios.post('/messages/files', data, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async sendVoiceMessage(voice: Buffer, ext: string, conversationId: uuid): Promise<void> {
    try {
      const audio = {
        buffer: voice.toString('base64'),
        title: `${uuidgen.v4()}.${ext}`
      }
      return this.axios.post('/messages/voice', { ...this.baseUserPayload, conversationId, audio }, this.axiosConfig)
    } catch (err) {
      await this.handleApiError(err)
    }
  }

  async setReference(reference: string, conversationId: uuid): Promise<void> {
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

  async listByIncomingEvent(messageId: uuid) {
    const { data: messages } = await this.axios.get(`/messaging/list-by-incoming-event/${messageId}`, {
      baseURL: window['BOT_API_PATH']
    })

    return messages
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
