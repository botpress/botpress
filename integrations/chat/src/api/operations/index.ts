import * as types from '../types'
import * as conversation from './conversation'
import * as event from './event'
import * as message from './message'
import * as user from './user'

export const operations = {
  ...user,
  ...conversation,
  ...message,
  ...event,
} satisfies { [O in types.OperationName]: types.Operations[O] | types.AuthenticatedOperations[O] }
