import { ApiUtils } from '../api-utils'
import { AuthKeyHandler } from '../auth-key'
import * as gen from '../gen/typings'
import { ChatIdStore } from '../id-store'
import { SignalEmitter } from '../signal-emitter'
import * as types from '../types'
import * as bp from '.botpress'

export * from '../types'

type SdkHandler = bp.IntegrationProps['handler']
type HandlerProps = Parameters<SdkHandler>[0]

export type OperationTools = {
  signals: SignalEmitter
  auth: AuthKeyHandler
  apiUtils: ApiUtils
  userIdStore: ChatIdStore
  convIdStore: ChatIdStore
}

export type OperationProps = HandlerProps & OperationTools

export type OperationName = keyof Operations
export type Operations = gen.Operations<OperationProps>
export type Operation = gen.Operation<OperationProps>
export type OperationInputs = types.Simplify<gen.Requests>
export type OperationOutputs = types.Simplify<gen.Responses>

export type RouteTree = gen.RouteTree<OperationProps>
export type Route = gen.Route<OperationProps>

export type AuthenticationResult = { userId: string }
export type AuthenticatedInputs = {
  [K in OperationName]: OperationInputs[K] & { auth: AuthenticationResult }
}
export type AuthenticatedOperations = {
  [K in OperationName]: (props: OperationProps, req: AuthenticatedInputs[K]) => Promise<OperationOutputs[K]>
}

export type MiddleWare<I, O> = (props: OperationProps, input: I) => Promise<O>
export type MiddleWares<I extends Record<OperationName, any>, O extends Record<OperationName, any>> = {
  [K in OperationName]: MiddleWare<I[K], O[K]>
}
