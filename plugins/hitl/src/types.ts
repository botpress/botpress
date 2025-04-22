import type * as sdk from '@botpress/sdk'
import * as consts from './consts'
import * as bp from '.botpress'

export type AnyHandlerProps =
  | bp.MessageHandlerProps
  | bp.EventHandlerProps
  | bp.ActionHandlerProps
  | bp.HookHandlerProps['before_incoming_message']
  | bp.HookHandlerProps['before_incoming_event']

export type ValueOf<T> = T[Extract<keyof T, string>]
type ArrayToUnion<T> = T extends Array<infer U> ? U : never

export type SupportedMessageTypes = ArrayToUnion<typeof consts.SUPPORTED_MESSAGE_TYPES>
type BaseMessagePayloads = Pick<typeof sdk.messages.defaults, SupportedMessageTypes>
export type MessagePayload = {
  [TMsgType in keyof BaseMessagePayloads]: {
    type: TMsgType
    userId?: string
  } & sdk.z.infer<BaseMessagePayloads[TMsgType]['schema']>
}[keyof BaseMessagePayloads]
