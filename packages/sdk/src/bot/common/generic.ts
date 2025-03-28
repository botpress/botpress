import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/common/generic'
import * as utils from '../../utils/type-utils'
import * as def from '../definition'

export * from '../../integration/common/generic'

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
  type: def.StateType
  payload: any
}

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, BaseState>
  actions: Record<string, BaseAction>
  tables: Record<string, BaseTable>
  workflows: Record<string, BaseWorkflow>
}

export type InputBaseBot = utils.DeepPartial<BaseBot>
export type DefaultBot<B extends InputBaseBot> = {
  events: utils.Default<B['events'], BaseBot['events']>
  states: utils.Default<B['states'], BaseBot['states']>
  actions: utils.Default<B['actions'], BaseBot['actions']>
  integrations: undefined extends B['integrations']
    ? BaseBot['integrations']
    : {
        [K in keyof B['integrations']]: DefaultIntegration<utils.Cast<B['integrations'][K], InputBaseIntegration>>
      }
  tables: utils.Default<B['tables'], BaseBot['tables']>
  workflows: utils.Default<B['workflows'], BaseBot['workflows']>
}
