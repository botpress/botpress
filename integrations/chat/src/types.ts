import * as bp from '.botpress'

export type ValueOf<T> = T[keyof T]

export type Simplify<T> = T extends (...args: infer A) => infer R
  ? (...args: Simplify<A>) => Simplify<R>
  : T extends Buffer
    ? Buffer
    : T extends Promise<infer R>
      ? Promise<Simplify<R>>
      : T extends object
        ? T extends infer O
          ? { [K in keyof O]: Simplify<O[K]> }
          : never
        : T

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type Handler = bp.IntegrationProps['handler']
export type HandlerProps = Parameters<Handler>[0]

export type Conversation = Awaited<ReturnType<bp.Client['getConversation']>>['conversation']
export type Message = Awaited<ReturnType<bp.Client['getMessage']>>['message']
export type User = Awaited<ReturnType<bp.Client['getUser']>>['user']
export type Event = Awaited<ReturnType<bp.Client['getEvent']>>['event']

export type MessageCallback = ValueOf<bp.Integration['channels']['channel']['messages']>
export type MessageArgs = Simplify<Parameters<MessageCallback>[0]>

type AsyncFunc = (...args: any[]) => Promise<any>
export type ClientOperation = Simplify<
  keyof {
    [K in keyof bp.Client as bp.Client[K] extends AsyncFunc ? K : never]: bp.Client[K]
  }
>

export type ClientRequests = {
  [K in ClientOperation]: Parameters<bp.Client[K]>[0]
}

export type ClientResponses = {
  [K in ClientOperation]: Awaited<ReturnType<bp.Client[K]>>
}

export type ActionInputs = {
  [K in keyof bp.Integration['actions']]: Parameters<bp.Integration['actions'][K]>[0]
}
export type ActionArgs = Simplify<ValueOf<ActionInputs>>
