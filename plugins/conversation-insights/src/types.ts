import * as bp from '.botpress'

// TODO: generate a type for CommonProps in the CLI / SDK
export type CommonProps =
  | bp.HookHandlerProps['before_incoming_message']
  | bp.HookHandlerProps['before_outgoing_message']
  | bp.EventHandlerProps
