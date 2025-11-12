import * as bp from '.botpress'

// TODO: generate a type for CommonProps in the CLI / SDK
export type CommonProps =
  | bp.HookHandlerProps['after_incoming_message']
  | bp.HookHandlerProps['after_outgoing_message']
  | bp.EventHandlerProps

export type ActionableConversation = NonNullable<
  Awaited<ReturnType<bp.MessageHandlerProps['conversations']['*']['*']['getById']>>
>
export type ActionableMessage = NonNullable<Awaited<ReturnType<bp.MessageHandlerProps['messages']['getById']>>>
