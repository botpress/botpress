import { Client } from '@botpress/nlu-client'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

interface ClientArgs {
  endpoint: string
  authToken?: string
  isLocal: boolean
}

export class NLUClientNoProxy extends Client {
  private _client: AxiosInstance

  constructor(args: ClientArgs) {
    super(args.endpoint, args.authToken)

    const { endpoint, authToken, isLocal } = args

    const config: AxiosRequestConfig = { baseURL: endpoint }
    if (authToken) {
      config.headers = { Authorization: `Bearer ${authToken}` }
    }

    if (isLocal) {
      config.proxy = false
    }
    this._client = axios.create(config)
  }
}
