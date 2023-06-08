import type { Client } from '@botpress/client'
import type { State, Event } from '@botpress/client/dist/gen'
import type { CreateEventProps, GetStateProps, SetStateProps } from '@botpress/client/dist/gen/client'
import nock from 'nock'

type ResponseOrCallback<TRequestPayload, TRequestBody, TResponse> =
  | TResponse
  | ((requestProps: { payload: TRequestPayload; body: TRequestBody }) => TResponse | void)

type Callback = (...args: any[]) => void

type MockRequestOptions = {
  times?: number
}

export class ClientMock {
  public readonly nock = nock

  constructor(private client: Client) {
    this.reset()
  }

  private isCallback(maybeFunction: any | Callback): maybeFunction is Callback {
    return typeof maybeFunction === 'function'
  }

  private getResponsePayload<TRequestPayload, TRequestBody, TResponse>(
    requestBody: nock.Body,
    responseOrCallback: ResponseOrCallback<TRequestPayload, TRequestBody, TResponse>
  ) {
    const body = requestBody as Record<string, string>
    const payload = body['payload'] as TRequestPayload

    return this.isCallback(responseOrCallback) ? responseOrCallback({ payload, body }) : responseOrCallback
  }

  private buildStateEndpointRegex(stateName: string, type: string = 'integration') {
    return new RegExp(`/chat/states/${type}/.+/${stateName}`)
  }

  private returns = <T extends CallableFunction>(callback: T) => ({
    returns: callback,
    listen: callback,
  })

  public reset() {
    nock.cleanAll()
  }

  public http(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
    const urlParts = new URL(url)
    const baseUrl = `${urlParts.protocol}//${urlParts.host}`
    const urlInterceptor = nock(baseUrl).intercept(urlParts.pathname, method)

    return {
      listen: (
        callback: <T>(requestProps: { body: Record<string, string> }) => T | void,
        responseHttpCode: number = 200
      ) => {
        urlInterceptor.reply((_uri, requestBody) => {
          const response = callback({ body: requestBody as Record<string, string> }) ?? {}
          return [responseHttpCode, response]
        })
      },
      reply: (responseHttpCode: number = 200) => {
        urlInterceptor.reply(responseHttpCode)
      },
    }
  }

  private getNockScope() {
    return nock(this.client.config.host)
  }

  public getState = (stateName: string, options?: MockRequestOptions) =>
    this.returns((responseOrCallback: ResponseOrCallback<GetStateProps, State, State['payload']>) =>
      this.getNockScope()
        .get(this.buildStateEndpointRegex(stateName))
        .times(options?.times ?? 1)
        .reply(200, (_uri, requestBody) => {
          return { state: { payload: this.getResponsePayload(requestBody, responseOrCallback) } }
        })
    )

  public setState = (stateName: string, options?: MockRequestOptions) =>
    this.returns((responseOrCallback: ResponseOrCallback<SetStateProps['payload'], State, State['payload']>) =>
      this.getNockScope()
        .post(this.buildStateEndpointRegex(stateName))
        .times(options?.times ?? 1)
        .reply(200, (_uri, requestBody) => {
          return { state: { payload: this.getResponsePayload(requestBody, responseOrCallback) } }
        })
    )

  public createEvent = () =>
    this.returns((responseOrCallback: ResponseOrCallback<CreateEventProps, Event, Event['payload']>) =>
      this.getNockScope()
        .post(new RegExp('/chat/events$'))
        .reply(200, (_uri, requestBody) => {
          return { event: { payload: this.getResponsePayload(requestBody, responseOrCallback) } }
        })
    )
}
