import { AxiosRequestConfig, AxiosStatic } from 'axios'

import { FLAGGED_MESSAGE_STATUS, RESOLUTION_TYPE } from '../../types'

const MODULE_URL_PREFIX = '/mod/misunderstood'

class ApiClient {
  constructor(private axios: AxiosStatic) {}

  async get(url: string, config?: AxiosRequestConfig) {
    const res = await this.axios.get(url, config)
    return res.data
  }

  async post(url: string, config?: AxiosRequestConfig) {
    const res = await this.axios.post(url, config)
    return res.data
  }

  getForModule(url: string, config?: AxiosRequestConfig) {
    return this.get(MODULE_URL_PREFIX + url, config)
  }

  postForModule(url: string, config?: AxiosRequestConfig) {
    return this.post(MODULE_URL_PREFIX + url, config)
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

  updateStatus(
    id: string,
    status: FLAGGED_MESSAGE_STATUS,
    resolutionData?: {
      resolutionType: RESOLUTION_TYPE
      resolution: string | null
      resolutionParams?: string | object | null
    }
  ) {
    return this.postForModule(`/events/${id}/status`, {
      params: { status, ...resolutionData }
    })
  }
}

export default ApiClient
