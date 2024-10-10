import { RuntimeError } from '@botpress/sdk'
import { BaseApiFacade, ApiFacadeClass } from '../api-client/api-facade'
import * as bp from '.botpress'

export type ActionKey = Extract<keyof bp.ActionProps, string>
export type ActionExecutorClass = new (
  props: bp.ActionProps[ActionKey] & { apiFacadeClass?: ApiFacadeClass }
) => BaseActionExecutor<ActionKey>

export abstract class BaseActionExecutor<ActionName extends ActionKey> {
  protected readonly _ctx: bp.ActionProps[ActionName]['ctx']
  protected readonly _client: bp.ActionProps[ActionName]['client']
  protected readonly _logger: bp.ActionProps[ActionName]['logger']
  protected readonly _input: bp.ActionProps[ActionName]['input']
  protected readonly _name: bp.ActionProps[ActionName]['type']
  private readonly _maybeApiFacade?: BaseApiFacade

  public constructor(props: bp.ActionProps[ActionName] & { apiFacadeClass?: ApiFacadeClass }) {
    this._ctx = props.ctx
    this._client = props.client
    this._logger = props.logger
    this._input = props.input
    this._name = props.type
    this._maybeApiFacade = props.apiFacadeClass ? new props.apiFacadeClass(props) : undefined
  }

  public async tryToExecute() {
    try {
      return await this.execute()
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(`${thrown}`)
      throw new RuntimeError(this.getErrorMessage(error))
    }
  }

  protected abstract execute(): Promise<bp.actions.Actions[ActionName]['output']>
  protected abstract getErrorMessage(originalError: Error): string

  protected get _apiFacade(): BaseApiFacade {
    if (!this._maybeApiFacade) {
      throw new Error('API facade is not available. You should register it in the integration builder.')
    }

    return this._maybeApiFacade
  }
}
