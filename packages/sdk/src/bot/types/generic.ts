import { Table } from '@botpress/client'
import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/types/generic'
import * as utils from '../../utils/type-utils'

export * from '../../integration/types/generic'

export type BaseAction = {
  input: any
  output: any
}

export type BaseTable = Exclude<Table, 'id' | 'createdAt' | 'updatedAt'>

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, BaseAction>
  tables: Record<string, BaseTable>
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
}
