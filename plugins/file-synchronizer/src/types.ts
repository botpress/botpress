import * as bp from '.botpress'

export type AnyHandlerProps = bp.EventHandlerProps | bp.ActionHandlerProps
export type EventHandlerProps = { [k in keyof bp.EventHandlers]: Parameters<bp.EventHandlers[k]>[0] }
