import * as bot from '../../bot'
import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/common/generic'
import { BaseInterface, InputBaseInterface, DefaultInterface } from '../../interface/common/generic'
import * as utils from '../../utils/type-utils'

export type BaseAction = {
  input: any
  output: any
}

export type BaseTable = {
  [k: string]: any
}

export type BaseWorkflow = {
  input: any
  output: any
  tags?: {
    [k: string]: string
  }
}

export type BaseState = {
  type: bot.StateType
  payload: any
}

export type BasePlugin = {
  name: string
  version: string
  configuration: any
  integrations: Record<string, BaseIntegration>
  interfaces: Record<string, BaseInterface>
  events: Record<string, any>
  states: Record<string, BaseState>
  actions: Record<string, BaseAction>
  tables: Record<string, BaseTable>
  workflows: Record<string, BaseWorkflow>
}

export type InputBasePlugin = utils.DeepPartial<BasePlugin>
export type DefaultPlugin<B extends utils.DeepPartial<BasePlugin>> = {
  name: utils.Default<B['name'], BasePlugin['name']>
  version: utils.Default<B['version'], BasePlugin['version']>
  configuration: utils.Default<B['configuration'], BasePlugin['configuration']>
  events: utils.Default<B['events'], BasePlugin['events']>
  states: utils.Default<B['states'], BasePlugin['states']>
  actions: utils.Default<B['actions'], BasePlugin['actions']>
  tables: utils.Default<B['tables'], BasePlugin['tables']>
  workflows: utils.Default<B['workflows'], BasePlugin['workflows']>
  integrations: undefined extends B['integrations']
    ? BasePlugin['integrations']
    : {
        [K in keyof B['integrations']]: DefaultIntegration<utils.Cast<B['integrations'][K], InputBaseIntegration>>
      }
  interfaces: undefined extends B['interfaces']
    ? BasePlugin['interfaces']
    : {
        [K in keyof B['interfaces']]: DefaultInterface<utils.Cast<B['interfaces'][K], InputBaseInterface>>
      }
}
