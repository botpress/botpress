import { BaseOAuthCallbackHandler } from 'src/lib/events/oauth-handler'

export class OAuthHandler extends BaseOAuthCallbackHandler {
  public async processEvent(): Promise<void> {
    // ... handle oauth callback ...

    await this._client.configureIntegration({ identifier: 'foo' })
  }
}
