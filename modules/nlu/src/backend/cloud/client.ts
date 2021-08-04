import { NLUClient } from '@botpress/nlu-client/src/client'
import { createOauthClient, OauthClientProps } from './oauth'

export class NLUCloudClient extends NLUClient {
  constructor(options: OauthClientProps) {
    super(options.endpoint, undefined)
    this._client = createOauthClient(options)
  }
}
