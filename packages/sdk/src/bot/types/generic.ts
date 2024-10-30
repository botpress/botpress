import { BaseIntegration } from '../../integration/types'
import * as utils from '../../utils/type-utils'

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
}

/**
 * Usefull for tests, allows to create a bot with only the properties you want to override
 */
export type MakeBot<B extends Partial<BaseBot>> = {
  integrations: utils.Default<B['integrations'], BaseBot['integrations']>
  events: utils.Default<B['events'], BaseBot['events']>
  states: utils.Default<B['states'], BaseBot['states']>
}

type _MakeBot_creates_a_TBot = utils.AssertExtends<BaseBot, MakeBot<{}>>
