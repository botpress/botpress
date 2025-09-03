import * as sdk from '@botpress/sdk'
import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios'

interface ClientBuilder {
  producePath(path: string): void
  produceParams(params: object): void
  produceBody(body: object): void
  produceMethod(method: Method): void
  produceToken(token: string): void
}

class WebflowClient {
  public baseUrl: string
  public path: string
  public headers: object
  public params: object
  public body: object
  public method: Method

  public constructor() {
    this.baseUrl = 'https://api.webflow.com/v2'
    this.path = '/'
    this.headers = {
      Authorization: 'Bearer ',
      'Content-Type': 'application/json',
    }
    this.body = {}
    this.params = {}
    this.method = 'GET'
  }

  public async sendRequest() {
    try {
      const client: AxiosInstance = axios.create({ baseURL: this.baseUrl })
      console.log('a')
      const config: AxiosRequestConfig = {
        url: this.path,
        method: this.method,
        headers: this.headers,
        params: this.params ?? {},
        data: this.body ?? {},
      }
      console.log(config)

      return await client.request(config)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
        throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
      }
      throw err
    }
  }
}

export class WeblowClientBuilder implements ClientBuilder {
  private _client!: WebflowClient

  public constructor() {
    this.reset()
  }

  public reset(): void {
    this._client = new WebflowClient()
  }

  public producePath(path: string): void {
    this._client.path = path
  }

  public produceParams(params: object): void {
    this._client.params = params
  }

  public produceBody(body: object): void {
    this._client.body = body
  }

  public produceMethod(method: Method): void {
    this._client.method = method
  }

  public produceToken(token: string): void {
    // the token is used in the header
    this._client.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  public getWebflowClient(): WebflowClient {
    const result = this._client
    this.reset()
    return result
  }
}
