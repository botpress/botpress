import { BaseApiFacade } from '../api-client/api-facade'
import * as bp from '.botpress'

export type WebhookHandlerClass = new (
  props: bp.HandlerProps & { apiFacade?: BaseApiFacade }
) => BaseWebhookEventHandler

export abstract class BaseWebhookEventHandler {
  private readonly _maybeApiFacade?: BaseApiFacade
  protected readonly _ctx: bp.HandlerProps['ctx']
  protected readonly _client: bp.HandlerProps['client']
  protected readonly _logger: bp.HandlerProps['logger']
  protected readonly _req: bp.HandlerProps['req']

  public constructor(props: bp.HandlerProps & { apiFacade?: BaseApiFacade }) {
    this._ctx = props.ctx
    this._client = props.client
    this._logger = props.logger
    this._req = props.req
    this._maybeApiFacade = props.apiFacade
  }

  protected get _apiFacade(): BaseApiFacade {
    if (!this._maybeApiFacade) {
      throw new Error('API facade is not available. You should register it in the integration builder.')
    }

    return this._maybeApiFacade
  }

  public abstract handlesEvent(): boolean
  public abstract processEvent(): Promise<void>
}
