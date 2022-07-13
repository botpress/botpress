import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import * as sdk from 'botpress/sdk'
import { backOff } from 'exponential-backoff'
import { MODULE_NAME } from '../constants'

const MAX_ATTEMPTS = 10

class WebHookService {
  constructor(private bp: typeof sdk) {}

  public async send(data: { payload: any; botId: string; type: string }) {
    const config = (await this.bp.config.getModuleConfig(MODULE_NAME)).eventsWebHook
    if (config) {
      const { url, headers } = config
      void this.sendToUrl(url, data, headers)
    }
  }

  public async sendToUrl(url: string, data: any, headers?: { [name: string]: string }) {
    const config: AxiosRequestConfig = {}

    if (headers) {
      config.headers = headers
    }

    try {
      await backOff(async () => axios.post(url, data, config), {
        jitter: 'none',
        numOfAttempts: MAX_ATTEMPTS,
        retry: (e: AxiosError, attemptNumber: number) => {
          if (attemptNumber === 1 && e.response?.status !== 503) {
            this.logWebhookError(e, url, 'Failed to send webhook event on first attempt. Retrying 9 more times')
          }
          return true
        }
      })
    } catch (e) {
      this.logWebhookError(e as AxiosError, url, `Unable to send webhook event after ${MAX_ATTEMPTS} attempts`)
    }
  }

  private logWebhookError(e: AxiosError, url: string, message: string) {
    this.bp.logger.warn(message, {
      url,
      message: e.message,
      response: e.response?.data,
      status: e.response?.status
    })
  }
}

export default WebHookService
