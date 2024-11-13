import * as types from './types'

export type PluginImplementationProps<_TPlugin extends types.BasePlugin = types.BasePlugin> = {
  // TODO: add actions here
}

const safePush = <T>(arr: T[] | undefined, value: T): T[] => {
  if (!arr) {
    return [value]
  }
  arr.push(value)
  return arr
}

export class PluginImplementation<TPlugin extends types.BasePlugin = types.BasePlugin> {
  private _hooks: types.HookImplementationsMap<TPlugin> = {
    before_incoming_event: {},
    before_incoming_message: {},
    before_outgoing_message: {},
    before_call_action: {},
    after_incoming_event: {},
    after_incoming_message: {},
    after_outgoing_message: {},
    after_call_action: {},
  }

  public constructor(public readonly props: PluginImplementationProps<TPlugin>) {}

  public readonly on = {
    before_incoming_event: <T extends keyof types.HookDefinitions<TPlugin>['before_incoming_event']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['before_incoming_event'][T]
    ) => {
      this._hooks.before_incoming_event[type] = safePush(this._hooks.before_incoming_event[type], handler)
    },
    before_incoming_message: <T extends keyof types.HookDefinitions<TPlugin>['before_incoming_message']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['before_incoming_message'][T]
    ) => {
      this._hooks.before_incoming_message[type] = safePush(this._hooks.before_incoming_message[type], handler)
    },
    before_outgoing_message: <T extends keyof types.HookDefinitions<TPlugin>['before_outgoing_message']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['before_outgoing_message'][T]
    ) => {
      this._hooks.before_outgoing_message[type] = safePush(this._hooks.before_outgoing_message[type], handler)
    },
    before_call_action: <T extends keyof types.HookDefinitions<TPlugin>['before_call_action']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['before_call_action'][T]
    ) => {
      this._hooks.before_call_action[type] = safePush(this._hooks.before_call_action[type], handler)
    },
    after_incoming_event: <T extends keyof types.HookDefinitions<TPlugin>['after_incoming_event']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['after_incoming_event'][T]
    ) => {
      this._hooks.after_incoming_event[type] = safePush(this._hooks.after_incoming_event[type], handler)
    },
    after_incoming_message: <T extends keyof types.HookDefinitions<TPlugin>['after_incoming_message']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['after_incoming_message'][T]
    ) => {
      this._hooks.after_incoming_message[type] = safePush(this._hooks.after_incoming_message[type], handler)
    },
    after_outgoing_message: <T extends keyof types.HookDefinitions<TPlugin>['after_outgoing_message']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['after_outgoing_message'][T]
    ) => {
      this._hooks.after_outgoing_message[type] = safePush(this._hooks.after_outgoing_message[type], handler)
    },
    after_call_action: <T extends keyof types.HookDefinitions<TPlugin>['after_call_action']>(
      type: T,
      handler: types.HookImplementations<TPlugin>['after_call_action'][T]
    ) => {
      this._hooks.after_call_action[type] = safePush(this._hooks.after_call_action[type], handler)
    },
  }

  public readonly run = {
    before_incoming_event: async <T extends keyof types.HookDefinitions<TPlugin>['before_incoming_event']>(
      type: T,
      input: types.HookInputs<TPlugin>['before_incoming_event'][T]
    ): Promise<types.HookOutputs<TPlugin>['before_incoming_event'][T]> => {
      return this._run('before_incoming_event', type, input)
    },
    before_incoming_message: async <T extends keyof types.HookDefinitions<TPlugin>['before_incoming_message']>(
      type: T,
      input: types.HookInputs<TPlugin>['before_incoming_message'][T]
    ): Promise<types.HookOutputs<TPlugin>['before_incoming_message'][T]> => {
      return this._run('before_incoming_message', type, input)
    },
    before_outgoing_message: async <T extends keyof types.HookDefinitions<TPlugin>['before_outgoing_message']>(
      type: T,
      input: types.HookInputs<TPlugin>['before_outgoing_message'][T]
    ): Promise<types.HookOutputs<TPlugin>['before_outgoing_message'][T]> => {
      return this._run('before_outgoing_message', type, input)
    },
    before_call_action: async <T extends keyof types.HookDefinitions<TPlugin>['before_call_action']>(
      type: T,
      input: types.HookInputs<TPlugin>['before_call_action'][T]
    ): Promise<types.HookOutputs<TPlugin>['before_call_action'][T]> => {
      return this._run('before_call_action', type, input)
    },
    after_incoming_event: async <T extends keyof types.HookDefinitions<TPlugin>['after_incoming_event']>(
      type: T,
      input: types.HookInputs<TPlugin>['after_incoming_event'][T]
    ): Promise<types.HookOutputs<TPlugin>['after_incoming_event'][T]> => {
      return this._run('after_incoming_event', type, input)
    },
    after_incoming_message: async <T extends keyof types.HookDefinitions<TPlugin>['after_incoming_message']>(
      type: T,
      input: types.HookInputs<TPlugin>['after_incoming_message'][T]
    ): Promise<types.HookOutputs<TPlugin>['after_incoming_message'][T]> => {
      return this._run('after_incoming_message', type, input)
    },
    after_outgoing_message: async <T extends keyof types.HookDefinitions<TPlugin>['after_outgoing_message']>(
      type: T,
      input: types.HookInputs<TPlugin>['after_outgoing_message'][T]
    ): Promise<types.HookOutputs<TPlugin>['after_outgoing_message'][T]> => {
      return this._run('after_outgoing_message', type, input)
    },
    after_call_action: async <T extends keyof types.HookDefinitions<TPlugin>['after_call_action']>(
      type: T,
      input: types.HookInputs<TPlugin>['after_call_action'][T]
    ): Promise<types.HookOutputs<TPlugin>['after_call_action'][T]> => {
      return this._run('after_call_action', type, input)
    },
  }

  private readonly _run = async <
    H extends keyof types.HookDefinitions<TPlugin>,
    T extends keyof types.HookDefinitions<TPlugin>[H]
  >(
    hook: H,
    type: T,
    input: types.HookInputs<TPlugin>[H][T]
  ): Promise<types.HookOutputs<TPlugin>[H][T]> => {
    const { client, ctx, data } = input
    const hooks = this._hooks[hook]
    const scopedHandlers = hooks[type] ?? []
    const globalHandlers = hooks['*'] ?? []
    const handlers = [...scopedHandlers, ...globalHandlers]
    const result = { data } as types.HookOutputs<TPlugin>[H][T]
    for (const handler of handlers) {
      const input = {
        data: result.data,
        client,
        ctx,
      } as types.HookInputs<TPlugin>[H][T]
      const output = await handler(input as any) // TODO: fix this type cast
      if (!output) {
        continue
      }
      result.data = output.data
    }
    return result
  }
}
