import axios, { AxiosInstance } from 'axios'
import { logger } from '../logger'
import { SignalEmitter, Signal } from './typings'

type PublishBody = {
  items: PublishItem[]
}

type PublishAction = 'send' | 'hint' | 'close' | 'refresh'
type PublishItem = {
  id?: string
  'prev-id'?: string
  channel?: string
  formats?: {
    'ws-message'?: {
      content?: string
      'content-bin'?: string
      action?: PublishAction
    }
    'http-stream'?: {
      content?: string
      'content-bin'?: string
      action?: PublishAction
    }
    'http-response'?: {
      action?: PublishAction
      code?: number
      reason?: string
      headers?: object
      body?: string
      'body-bin'?: string
    }
  }
}

export class PushpinEmitter implements SignalEmitter {
  private _client: AxiosInstance

  public constructor(emitUrl: string, secreKey: string | undefined) {
    const headers: Record<string, string> = !secreKey
      ? {}
      : {
          Authorization: `Basic ${secreKey}`,
        }
    this._client = axios.create({
      baseURL: emitUrl,
      headers,
    })
  }

  public async emit(channel: string, signal: Signal): Promise<void> {
    await this._publish({
      items: [
        {
          channel,
          formats: {
            'http-stream': {
              action: 'send',
              content: this._sse(signal),
            },
          },
        },
      ],
    }).catch(this._handleError)
  }

  public async close(channel: string): Promise<void> {
    await this._publish({
      items: [
        {
          channel,
          formats: {
            'http-stream': {
              action: 'close',
            },
          },
        },
      ],
    }).catch(this._handleError)
  }

  private async _publish(body: PublishBody): Promise<void> {
    await this._client.post('/publish', body)
  }

  private _sse = (signal: Signal): string => {
    const data = JSON.stringify(signal)
    return ['event: message', `data: ${data}`, '', ''].join('\n')
  }

  private _handleError = (thrown: unknown): void => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.error(`An error occured when publishing to Pushpin: "${error.message}"`)
  }
}
