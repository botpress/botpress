import { Request } from '@botpress/sdk'
import qs from 'qs'
import * as api from '../api'
import * as errors from '../gen/errors'
import * as grip from '../grip'

export const isPushpinWebSocketRequest = (req: Request) => {
  if (req.method.toLowerCase() !== 'post') {
    return false
  }
  const parts = req.path.split('/').splice(1)
  if (parts.length !== 3) {
    return false
  }
  return parts[0] === 'conversations' && parts[2] === 'listen'
}

type WebSocketRequestProps = {
  userKey: string
  conversationId: string
  events: grip.WebSocketEvent[]
}

const _parsePushpinWebSocketRequest = (req: Request): WebSocketRequestProps => {
  if (!req.body) {
    throw new Error('Could not parse events')
  }
  const events = grip.parseWebSocketEvents(Buffer.from(req.body))

  const queries = qs.parse(req.query)
  if (!queries['x-user-key'] || typeof queries['x-user-key'] !== 'string') {
    throw new Error('Could not parse `x-user-key`')
  }
  const userKey = queries['x-user-key']

  const urlParts = req.path.split('/').splice(1)
  if (urlParts.length !== 3) {
    throw new Error('Could not parse url.')
  }
  const conversationId = urlParts[1]!

  return {
    userKey,
    events,
    conversationId,
  }
}

export const handlePushpinWebSocketRequest = async (props: api.OperationTools, req: Request) => {
  const { userKey, events, conversationId: _conversationId } = _parsePushpinWebSocketRequest(req)
  const _userId = props.auth.parseKey(userKey).id
  const [userId, conversationId] = await Promise.all([
    props.userIdStore.byFid.get(_userId),
    props.convIdStore.byFid.get(_conversationId),
  ])

  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId })
  if (!participant) {
    throw new errors.ForbiddenError('You are not a participant in this conversation')
  }

  if (events.length === 0 || events[0]?.type !== 'open') {
    throw new Error('Could not open a websocket connection')
  }

  const channels = [conversationId, userId]
  const body = grip.openAndSubscribeBody(channels).toString()

  const keepAliveMessage = 'ping'
  const b64KeepAlive = Buffer.from(keepAliveMessage, 'utf-8').toString('base64')
  return {
    body,
    headers: {
      'Content-Type': 'application/websocket-events',
      'Grip-Hold': 'stream',
      'Grip-Channel': channels.join(','),
      'Grip-Keep-Alive': `${b64KeepAlive}; format=base64; timeout=30;`,
      'Sec-WebSocket-Extensions': 'grip',
    },
  }
}
