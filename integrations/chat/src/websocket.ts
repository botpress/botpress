import { Request } from '@botpress/sdk'
import qs from 'qs'
import * as api from './api'
import * as errors from './gen/errors'
import { messages, websocket } from '@bpinternal/pingrip'

export const isWebSocketRequest = (req: Request) => {
  if (req.method.toLowerCase() !== 'post') {
    return false
  }
  const parts = req.path.split('/').splice(1)
  if (parts.length !== 3) {
    return false
  }
  return parts[0] === 'conversations' && parts[2] === 'listen'
}

type RequestIdentifiers = {
  conversationId: string
  userId: string
}

const extractRequestIdentifiers = async (props: api.OperationTools, req: Request): Promise<RequestIdentifiers> => {
  const queries = qs.parse(req.query)
  if (!queries['x-user-key'] || typeof queries['x-user-key'] !== 'string') {
    throw new errors.UnauthorizedError('x-user-key should be speicified as a query param.')
  }
  const userKey = queries['x-user-key']

  const urlParts = req.path.split('/').splice(1)
  if (urlParts.length !== 3) {
    throw new errors.InternalError('An unexpected error occured.')
  }
  const _userId = props.auth.parseKey(userKey).id
  const [userId, conversationId] = await Promise.all([
    props.userIdStore.byFid.get(_userId),
    props.convIdStore.byFid.get(urlParts[1]!),
  ])

  return {
    userId,
    conversationId,
  }
}

export const handleWebSocketRequest = async (props: api.OperationTools, req: Request) => {
  if (!req.body) {
    throw new errors.InvalidPayloadError('The payload should be a open or close websocket message.')
  }
  const { userId, conversationId } = await extractRequestIdentifiers(props, req)
  const channels = [conversationId, userId]

  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId })
  if (!participant) {
    throw new errors.ForbiddenError('You are not a participant in this conversation')
  }

  for (const message of messages.parse(Buffer.from(req.body))) {
    if (message.type === 'open') {
      const response = new websocket.ResponseBuilder()
        .open()
        .keepAlive("ping", 30)
        .subscribe(channels)
        .toResponse()
      return {
        ...response,
        body: response.body.toString(),
      }
    }
    if (message.type === 'close') {
      const response = new websocket.ResponseBuilder()
        .close(message.code)
        .unsubscribe(channels)
        .toResponse()
      return {
        ...response,
        body: response.body.toString(),
      }
    }
  }
  throw new errors.InvalidPayloadError('The payload should be a open or close websocket message.')
}
