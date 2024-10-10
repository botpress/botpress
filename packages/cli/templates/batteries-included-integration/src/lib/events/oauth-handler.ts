import { BaseWebhookEventHandler } from './base-event-handler'

export abstract class BaseOAuthCallbackHandler extends BaseWebhookEventHandler {
  public handlesEvent() {
    return this._req.path === '/oauth'
  }
}
