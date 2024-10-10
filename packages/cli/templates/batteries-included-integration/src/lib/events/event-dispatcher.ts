import { ApiFacadeClass, BaseApiFacade } from '../api-client/api-facade'
import { WebhookHandlerClass } from './base-event-handler'
import * as bp from '.botpress'

export class WebhookEventDispatcher {
  private readonly _handlers: WebhookHandlerClass[]
  private readonly _apiFacade?: BaseApiFacade
  private readonly _ctx: bp.HandlerProps['ctx']
  private readonly _client: bp.HandlerProps['client']
  private readonly _logger: bp.HandlerProps['logger']
  private readonly _req: bp.HandlerProps['req']

  public constructor(props: bp.HandlerProps & { handlers: WebhookHandlerClass[]; apiFacadeClass?: ApiFacadeClass }) {
    this._handlers = props.handlers
    this._apiFacade = props.apiFacadeClass ? new props.apiFacadeClass(props) : undefined
    this._ctx = props.ctx
    this._client = props.client
    this._logger = props.logger
    this._req = props.req
  }

  public async dispatch(): Promise<void> {
    for (const handlerClass of this._handlers) {
      const handlerInstance = new handlerClass({
        ctx: this._ctx,
        client: this._client,
        logger: this._logger,
        req: this._req,
        apiFacade: this._apiFacade,
      })

      if (handlerInstance.handlesEvent()) {
        return await handlerInstance.processEvent()
      }
    }
  }
}
