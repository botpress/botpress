import _ from 'lodash'
import { ChatApi } from '../api'
import * as conversation from './conversation'
import * as event from './event'
import * as message from './message'
import * as user from './user'

export * as conversation from './conversation'
export * as message from './message'
export * as user from './user'
export * as event from './event'

type ValueOf<T> = T[keyof T]
export type OperationFunction = ValueOf<typeof conversation> | ValueOf<typeof message> | ValueOf<typeof user>

export type Operation = ReturnType<OperationFunction>

const operationFunctions = { ...conversation, ...message, ...user, ...event }
export const createOperations = (api: ChatApi) => _.mapValues(operationFunctions, (fn) => fn(api))
