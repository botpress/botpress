import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../integration/types/generic'
import * as utils from '../utils/type-utils'

export type BaseAction = {
  input: any
  output: any
}

export type BasePlugin = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, BaseAction>
}

export type InputBasePlugin = utils.DeepPartial<BasePlugin>
export type DefaultPlugin<B extends utils.DeepPartial<BasePlugin>> = {
  events: utils.Default<B['events'], BasePlugin['events']>
  states: utils.Default<B['states'], BasePlugin['states']>
  actions: utils.Default<B['actions'], BasePlugin['actions']>
  integrations: undefined extends B['integrations']
    ? BasePlugin['integrations']
    : {
        [K in keyof B['integrations']]: DefaultIntegration<utils.Cast<B['integrations'][K], InputBaseIntegration>>
      }
}
