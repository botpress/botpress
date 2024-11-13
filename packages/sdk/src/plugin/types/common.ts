import * as client from '@botpress/client'
import { BotContext, BotSpecificClient } from '../../bot'
import * as bot from '../../bot/types'
import * as utils from '../../utils/type-utils'
import { BasePlugin } from './generic'

export type HookType = keyof HookDefinitions<BasePlugin>

type IncomingEvents<TPlugin extends BasePlugin> = {
  [K in keyof bot.EnumerateEvents<TPlugin>]: utils.Merge<
    client.Event,
    { type: K; payload: bot.EnumerateEvents<TPlugin>[K] }
  >
}

type IncomingMessages<TPlugin extends BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<client.Message, { type: K; payload: bot.GetMessages<TPlugin>[K] }>
}

type OutgoingMessageRequests<TPlugin extends BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type OutgoingMessageResponses<TPlugin extends BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: bot.GetMessages<TPlugin>[K] }>
    }
  >
}

type CallActionRequests<TPlugin extends BasePlugin> = {
  [K in keyof bot.EnumerateActionInputs<TPlugin>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: bot.EnumerateActionInputs<TPlugin>[K] }
  >
}

type CallActionResponses<TPlugin extends BasePlugin> = {
  [K in keyof bot.EnumerateActionOutputs<TPlugin>]: utils.Merge<
    client.ClientOutputs['callAction'],
    { output: bot.EnumerateActionOutputs<TPlugin>[K] }
  >
}

/**
 * TODO:
 * - add concept of stoppable / un-stoppable hooks (e.g. before_incoming_message  Vs before_outgoing_message)
 * - add "*" type for all hooks
 * - add "before_register", "after_register", "before_state_expired", "after_state_expired" hooks
 */
export type HookDefinitions<TPlugin extends BasePlugin> = {
  before_incoming_event: IncomingEvents<TPlugin>
  before_incoming_message: IncomingMessages<TPlugin>
  before_outgoing_message: OutgoingMessageRequests<TPlugin>
  before_call_action: CallActionRequests<TPlugin>
  after_incoming_event: IncomingEvents<TPlugin>
  after_incoming_message: IncomingMessages<TPlugin>
  after_outgoing_message: OutgoingMessageResponses<TPlugin>
  after_call_action: CallActionResponses<TPlugin>
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
