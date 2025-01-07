import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/types/generic'
import * as utils from '../../utils/type-utils'

export * from '../../integration/types/generic'

export type BaseAction = {
  input: any
  output: any
}

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, BaseAction>

  /**
   * In a bot, all events, actions, states, and integrations definitions are known.
   * This mean the Bot typings should not allow for unknown types.
   *
   * In a plugin, we don't known about extra definitions of the bot that installed the plugin.
   * This mean the Plugin typings should allow for unknown types.
   */
  unknownDefinitions: boolean
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

  unknownDefinitions: false
}
