import { Client, RuntimeError } from '@botpress/client'
import { BotSpecificClient, StateType } from '../../bot'
import * as consts from '../../consts'
import { BasePlugin, PluginRuntimeProps } from '../common'
import { StateProxy, StateRepo } from './types'

class _StateRepo<TPayload extends object> implements StateRepo<TPayload> {
  public constructor(
    private _client: BotSpecificClient<any> | Client,
    private _stateType: StateType,
    private _stateName: string,
    private _expiryMs?: number
  ) {}

  public withExpiry(expiryMs: number): _StateRepo<TPayload> {
    return new _StateRepo<TPayload>(this._client, this._stateType, this._stateName, expiryMs)
  }

  public async get(id: string): Promise<TPayload> {
    if (this._expiryMs) throw new RuntimeError('You cannot set an expiry when getting a state')
    return await this._client
      .getState({
        type: this._stateType,
        name: this._stateName,
        id,
      })
      .then((r) => r.state.payload)
  }

  public async set(id: string, payload: TPayload): Promise<void> {
    await this._client.setState({
      type: this._stateType,
      name: this._stateName,
      id,
      payload,
      expiry: this._expiryMs,
    })
    return
  }

  public async getOrSet(id: string, payload: TPayload): Promise<TPayload> {
    return await this._client
      .getOrSetState({
        type: this._stateType,
        name: this._stateName,
        id,
        payload,
        expiry: this._expiryMs,
      })
      .then((r) => r.state.payload)
  }

  public async delete(id: string): Promise<void> {
    if (this._expiryMs) throw new RuntimeError('You cannot set an expiry when deleting a state')
    await this._client.setState({
      type: this._stateType,
      name: this._stateName,
      id,
      payload: null,
    })
    return
  }

  public async patch(id: string, payload: Partial<TPayload>): Promise<void> {
    if (this._expiryMs) throw new RuntimeError('You cannot set an expiry when patching a state')
    await this._client.patchState({
      type: this._stateType,
      name: this._stateName,
      id,
      payload,
    })
    return
  }
}

export const proxyStates = <TPlugin extends BasePlugin>(
  client: BotSpecificClient<TPlugin> | Client,
  props: PluginRuntimeProps<TPlugin>
): StateProxy<TPlugin> =>
  new Proxy<Partial<StateProxy<TPlugin>>>(
    {},
    {
      get: (_target, stateType: StateType) => {
        return new Proxy(
          {},
          {
            get: (_target, stateName: string) => {
              const actualName =
                props.alias !== undefined ? `${props.alias}${consts.PLUGIN_PREFIX_SEPARATOR}${stateName}` : stateName
              return new _StateRepo(client, stateType, actualName, undefined)
            },
          }
        )
      },
    }
  ) as StateProxy<TPlugin>
