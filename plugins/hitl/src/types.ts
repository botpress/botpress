import * as bp from '.botpress'

export type HandlerProps =
  | bp.MessageHandlerProps
  | bp.EventHandlerProps
  | bp.ActionHandlerProps
  | bp.HookHandlerProps['before_incoming_message']
  | bp.HookHandlerProps['before_incoming_event']
