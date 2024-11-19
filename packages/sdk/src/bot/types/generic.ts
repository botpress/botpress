import { BaseIntegration } from '../../integration/types/generic'
import * as utils from '../../utils/type-utils'

export * from '../../integration/types/generic'

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, Record<'input' | 'output', any>>
}

export type DefaultBot<B extends Partial<BaseBot>> = {
  integrations: utils.Default<B['integrations'], BaseBot['integrations']>
  events: utils.Default<B['events'], BaseBot['events']>
  states: utils.Default<B['states'], BaseBot['states']>
  actions: utils.Default<B['actions'], BaseBot['actions']>
}

type _MakeBot_creates_a_TBot = utils.AssertExtends<DefaultBot<{}>, BaseBot>
