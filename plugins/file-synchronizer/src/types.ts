import * as bp from '.botpress'

export type AnyHandlerProps =
  | bp.EventHandlerProps
  | bp.ActionHandlerProps
  | bp.HookHandlerProps['before_incoming_event']
