import * as bp from '.botpress'

type BaseProps = {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}

export type ApiFacadeClass = new (props: BaseProps) => BaseApiFacade

export abstract class BaseApiFacade {
  protected readonly _ctx: bp.Context
  protected readonly _client: bp.Client
  protected readonly _logger: bp.Logger

  public constructor(props: BaseProps) {
    this._ctx = props.ctx
    this._client = props.client
    this._logger = props.logger
  }
}
