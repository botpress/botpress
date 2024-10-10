import { ExampleApiClient } from 'src/api-client/api-client'
import { BaseApiFacade } from 'src/lib/api-client/api-facade'
import { BaseWebhookEventHandler } from 'src/lib/events/base-event-handler'
import * as bp from '.botpress'

export abstract class BrandedWebhookEventHandler extends BaseWebhookEventHandler {
  protected readonly _json: Record<string, any> & { type: string }

  public constructor(props: bp.HandlerProps & { apiFacade?: BaseApiFacade }) {
    super(props)

    this._json = JSON.parse(props.req.body ?? '{}')
  }

  protected override get _apiFacade(): ExampleApiClient {
    return super._apiFacade as ExampleApiClient
  }
}
