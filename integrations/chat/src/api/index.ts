import { createRouteTree } from '../gen/tree'
import { operations as ops } from './operations'
import * as types from './types'

export * from './types'

const pipe = <A, B, C>(head: types.MiddleWare<A, B>, tail: types.MiddleWare<B, C>): types.MiddleWare<A, C> => {
  return async (props, input) => {
    const middle = await head(props, input)
    return tail(props, middle)
  }
}

const authenticate = async <T extends { headers: { 'x-user-key': string } }>(
  props: types.OperationProps,
  req: T
): Promise<T & { auth: { userId: string } }> => {
  const identity = req.headers['x-user-key']

  const parsedKey = props.auth.parseKey(identity)
  const userId = parsedKey.id

  return { ...req, auth: { userId } }
}

export const operations: types.Operations = {
  createUser: ops.createUser,
  getUser: pipe(authenticate, ops.getUser),
  getOrCreateUser: pipe(authenticate, ops.getOrCreateUser),
  updateUser: pipe(authenticate, ops.updateUser),
  deleteUser: pipe(authenticate, ops.deleteUser),
  createConversation: pipe(authenticate, ops.createConversation),
  getConversation: pipe(authenticate, ops.getConversation),
  getOrCreateConversation: pipe(authenticate, ops.getOrCreateConversation),
  deleteConversation: pipe(authenticate, ops.deleteConversation),
  listConversations: pipe(authenticate, ops.listConversations),
  listMessages: pipe(authenticate, ops.listMessages),
  listenConversation: pipe(authenticate, ops.listenConversation),
  addParticipant: pipe(authenticate, ops.addParticipant),
  getParticipant: pipe(authenticate, ops.getParticipant),
  removeParticipant: pipe(authenticate, ops.removeParticipant),
  listParticipants: pipe(authenticate, ops.listParticipants),
  createMessage: pipe(authenticate, ops.createMessage),
  getMessage: pipe(authenticate, ops.getMessage),
  deleteMessage: pipe(authenticate, ops.deleteMessage),
  createEvent: pipe(authenticate, ops.createEvent),
  getEvent: pipe(authenticate, ops.getEvent),
}

export const routes = createRouteTree(operations)
