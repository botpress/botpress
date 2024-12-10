import axios, { AxiosInstance } from 'axios'
import { logger } from '../logger'
import { SignalEmitter, Signal } from './typings'

export class WebhookEmitter implements SignalEmitter {
  private _client: AxiosInstance

  public constructor(webhookUrl: string, secreKey: string | undefined) {
    const headers: Record<string, string> = !secreKey
      ? {}
      : {
          'x-secret-key': secreKey,
        }
    this._client = axios.create({
      baseURL: webhookUrl,
      headers,
    })
  }

  public async emit(_channel: string, signal: Signal): Promise<void> {
    await this._client.post('/', signal).catch(this._handleError)
  }

  public async close(): Promise<void> {
    // the webhook signal emitter cannot be closed since it's only accessible to the admin and not scoped to a user
  }

  private _handleError = (thrown: unknown): void => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.error(`An error occured when emitting a signal to Webhook: "${error.message}"`)
  }
}
