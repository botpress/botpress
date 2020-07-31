import { AxiosRequestConfig, AxiosStatic } from 'axios'

import { FLAGGED_MESSAGE_STATUS, ResolutionData, RESOLUTION_TYPE } from '../../types'

const MODULE_URL_PREFIX = '/mod/misunderstood'

class ApiClient {
  constructor(private axios: AxiosStatic) {}

  async get(url: string, config?: AxiosRequestConfig) {
    const res = await this.axios.get(url, config)
    return res.data
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    const res = await this.axios.post(url, data, config)
    return res.data
  }

  getForModule(url: string, config?: AxiosRequestConfig) {
    return this.get(MODULE_URL_PREFIX + url, config)
  }

  postForModule(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.post(MODULE_URL_PREFIX + url, data, config)
  }

  getEventCounts(language: string) {
    return this.getForModule('/events/count', {
      params: {
        language
      }
    })
  }

  getEvents(language: string, status: string) {
    return this.getForModule(`/events/${status}`, {
      params: {
        language
      }
    })
  }

  getEvent(id: string) {
    return this.getForModule(`/events/${id}`)
  }

  updateStatus(id: string, status: FLAGGED_MESSAGE_STATUS, resolutionData?: ResolutionData) {
    return this.postForModule(`/events/${id}/status`, {
      status,
      ...resolutionData,
      resolutionParams:
        resolutionData && resolutionData.resolutionParams ? JSON.stringify(resolutionData.resolutionParams) : undefined
    })
  }

  applyAllPending() {
    return this.postForModule('/apply-all-pending')
  }
}

export default ApiClient
