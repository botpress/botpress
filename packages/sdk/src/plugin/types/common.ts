import { BotContext, BotSpecificClient } from '../../bot'
import * as bot from '../../bot/types'
import { BasePlugin } from './generic'

export type HookType = keyof HookDefinitions<BasePlugin>

/**
 * TODO:
 * - add concept of stoppable / un-stoppable hooks (e.g. before_incoming_message  Vs before_outgoing_message)
 * - add "*" type for all hooks
 * - add "before_register", "after_register", "before_state_expired", "after_state_expired" hooks
 */
export type HookDefinitions<TPlugin extends BasePlugin> = {
  before_incoming_event: bot.EnumerateEvents<TPlugin>
  before_incoming_message: bot.GetMessages<TPlugin>
  before_outgoing_message: bot.GetMessages<TPlugin>
  before_call_action: bot.EnumerateActionInputs<TPlugin>
  after_incoming_event: bot.EnumerateEvents<TPlugin>
  after_incoming_message: bot.GetMessages<TPlugin>
  after_outgoing_message: bot.GetMessages<TPlugin>
  after_call_action: bot.EnumerateActionOutputs<TPlugin>
}

export type HookInputs<TPlugin extends BasePlugin> = {
  [H in keyof HookDefinitions<TPlugin>]: {
    [T in keyof HookDefinitions<TPlugin>[H]]: {
      client: BotSpecificClient<TPlugin>
      ctx: BotContext
      data: HookDefinitions<TPlugin>[H][T]
    }
  }
}

export type HookOutputs<TPlugin extends BasePlugin> = {
  [H in keyof HookDefinitions<TPlugin>]: {
    [T in keyof HookDefinitions<TPlugin>[H]]: {
      data: HookDefinitions<TPlugin>[H][T]
    }
  }
}

export type HookImplementations<TPlugin extends BasePlugin> = {
  [H in keyof HookDefinitions<TPlugin>]: {
    [T in keyof HookDefinitions<TPlugin>[H]]: (
      input: HookInputs<TPlugin>[H][T]
    ) => Promise<HookOutputs<TPlugin>[H][T] | undefined>
  }
}

export type HookImplementationsMap<TPlugin extends BasePlugin> = {
  [H in keyof HookDefinitions<TPlugin>]: {
    [T in keyof HookDefinitions<TPlugin>[H]]?: HookImplementations<TPlugin>[H][T][]
  }
}
