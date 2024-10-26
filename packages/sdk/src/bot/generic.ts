import { BaseIntegration } from '../integration/generic'
import * as utils from '../utils/type-utils'

export type BaseIntegrations = Record<string, BaseIntegration>
export type BaseBot = {
  integrations: BaseIntegrations
  events: Record<string, any>
  states: Record<string, any>
}

export type MakeBot<B extends Partial<BaseBot>> = {
  integrations: utils.Default<B['integrations'], BaseBot['integrations']>
  events: utils.Default<B['events'], BaseBot['events']>
  states: utils.Default<B['states'], BaseBot['states']>
}

type _MakeBot_creates_a_TBot = utils.AssertExtends<BaseBot, MakeBot<{}>>
