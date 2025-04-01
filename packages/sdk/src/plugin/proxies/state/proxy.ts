import { Client } from '@botpress/client'
import { BotSpecificClient, StateType } from '../../../bot'
import { BasePlugin, PluginRuntimeProps } from '../../common'
import { StateProxy, StateRepo } from './types'

// TODO: this constant is dupplicated in many place; find a common location
const PLUGIN_PREFIX_SEPARATOR = '#'

class _StateRepo<TPayload extends object> implements StateRepo<TPayload> {
  public constructor(
    private _client: BotSpecificClient<any> | Client,
    private _stateType: StateType,
    private _stateName: string
  ) {}

  public async get(id: string): Promise<TPayload> {
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
      })
      .then((r) => r.state.payload)
  }

  public async delete(id: string): Promise<void> {
    await this._client.setState({
      type: this._stateType,
      name: this._stateName,
      id,
      payload: null,
    })
    return
  }

  public async patch(id: string, payload: Partial<TPayload>): Promise<void> {
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
                props.alias !== undefined ? `${props.alias}${PLUGIN_PREFIX_SEPARATOR}${stateName}` : stateName
              return new _StateRepo(client, stateType, actualName)
            },
          }
        )
      },
    }
  ) as StateProxy<TPlugin>
