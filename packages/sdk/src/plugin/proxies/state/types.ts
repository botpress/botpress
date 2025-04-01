import * as bot from '../../../bot'
import * as utils from '../../../utils/type-utils'
import { BasePlugin } from '../../common'

type _EnumerateStates<TPlugin extends BasePlugin> = {
  [TStateName in keyof TPlugin['states']]: TPlugin['states'][TStateName] & { name: TStateName }
}

type _FilterStates<TPlugin extends BasePlugin, TStateType extends bot.StateType> = Extract<
  utils.ValueOf<_EnumerateStates<TPlugin>>,
  { type: TStateType }
>['name']

type _GetStatePayload<
  TPlugin extends BasePlugin,
  TStateName extends string | number | symbol,
> = TPlugin['states'][utils.Cast<TStateName, keyof TPlugin['states']>]['payload']

export type StateRepo<TPayload> = {
  get: (id: string) => Promise<TPayload>
  set: (id: string, payload: TPayload) => Promise<void>
  getOrSet: (id: string, payload: TPayload) => Promise<TPayload>
  delete: (id: string) => Promise<void>
  patch: (id: string, payload: Partial<TPayload>) => Promise<void>
}

export type StateProxy<TPlugin extends BasePlugin> = utils.Normalize<{
  [TStateType in bot.StateType]: {
    [TStateName in _FilterStates<TPlugin, TStateType>]: StateRepo<_GetStatePayload<TPlugin, TStateName>>
  }
}>
