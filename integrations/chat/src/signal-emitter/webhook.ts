import axios, { AxiosInstance } from 'axios'
import { SignalEmitter, Signal } from './typings'
import * as bp from '.botpress'

export class WebhookEmitter implements SignalEmitter {
  private _client: AxiosInstance

  public constructor(
    webhookUrl: string,
    secreKey: string | undefined,
    private _logger: bp.Logger
  ) {
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
    await this.emitOrThrow(_channel, signal).catch(this._handleError)
  }

  public async emitOrThrow(_channel: string, signal: Signal): Promise<void> {
    await this._client.post('/', signal)
  }

  public async close(): Promise<void> {
    // the webhook signal emitter cannot be closed since it's only accessible to the admin and not scoped to a user
  }

  private _handleError = (thrown: unknown): void => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    // The webhook URL comes from the bot's configuration, so a delivery
    // failure is only actionable by the bot owner:
    this._logger.forBot().error(`An error occured when emitting a signal to Webhook: "${error.message}"`)
  }
}
