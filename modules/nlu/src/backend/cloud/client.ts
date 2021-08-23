import { Client } from '@botpress/nlu-client'
import { AxiosInstance } from 'axios'
import { createOauthClient, OauthClientProps } from './oauth'

export class NLUCloudClient extends Client {
  private _client: AxiosInstance

  constructor(options: OauthClientProps) {
    super(options.endpoint, undefined)
    this._client = createOauthClient(options)
  }
}
