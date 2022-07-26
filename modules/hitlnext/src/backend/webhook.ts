import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import * as sdk from 'botpress/sdk'
import { backOff } from 'exponential-backoff'
import { Webhook } from '../config'
import { MODULE_NAME } from '../constants'

const MAX_ATTEMPTS = 10

class WebHookService {
  private config: Webhook
  private disabled = true
  constructor(private bp: typeof sdk) {
    void this.setup()
  }

  private async setup() {
    this.config = (await this.bp.config.getModuleConfig(MODULE_NAME)).eventsWebHook
    this.disabled = !this.config?.url
  }

  public async send(data: { botId: string; type: string; resource: string; id: string; payload: any }) {
    if (this.disabled) {
      return
    }

    const { url, headers } = this.config
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
