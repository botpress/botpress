import _ from 'lodash'
import { ChatApi } from '../api'
import * as conversation from './conversation'
import * as event from './event'
import * as initialize from './initialize'
import * as message from './message'
import * as user from './user'

export * as conversation from './conversation'
export * as event from './event'
export * as message from './message'
export * as user from './user'
export * as initialize from './initialize'

type ValueOf<T> = T[keyof T]
export type OperationFunction =
  | ValueOf<typeof conversation>
  | ValueOf<typeof message>
  | ValueOf<typeof user>
  | ValueOf<typeof initialize>

export type Operation = ReturnType<OperationFunction>

const operationFunctions = { ...conversation, ...message, ...user, ...event, ...initialize }
export const createOperations = (api: ChatApi) => _.mapValues(operationFunctions, (fn) => fn(api))
