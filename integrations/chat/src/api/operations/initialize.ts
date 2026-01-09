import { InvalidPayloadError } from 'src/gen/errors'
import * as signals from '../../gen/signals'
import * as msgPayload from '../message-payload'
import * as types from '../types'
import { Client } from '.botpress'

type InitialEvent = signals.Types['initialized']
type User = Parameters<Client['initializeIncomingMessage']>[0]['user']
type Conversation = Parameters<Client['initializeIncomingMessage']>[0]['conversation']
type Message = NonNullable<Parameters<Client['initializeIncomingMessage']>[0]['message']>

export const initialize: types.Operations['initializeIncomingMessage'] = async (props, req) => {
  let userKey = req.headers['x-user-key']

  let userId: string | undefined
  if (userKey) {
    const parsedKey = props.auth.parseKey(userKey)
    userId = parsedKey.id
  }

  if ((!userId && !req.body.user) || (userId && req.body.user)) {
    throw new InvalidPayloadError('You have to set either the "x-user-key" header or the "user" body parameter.')
  }

  const userRequest: { user?: User; userId?: string } = {}
  if (req.body.user) {
    userRequest.user = { ...req.body.user, tags: {}, discriminateByTags: [] }
  } else {
    userRequest.userId = userId
  }

  const conversationRequest: { conversationId?: string; conversation?: Conversation } = {}
  if (req.body.conversationId) {
    //in that case, look for it using fid?
    conversationRequest.conversationId = req.body.conversationId
  } else {
    conversationRequest.conversation = { channel: 'channel', tags: {}, discriminateByTags: [] }
  }

  let msg: { message: Message } | undefined
  if (req.body.message) {
    const payload = msgPayload.mapChatMessageToBotpress({
      payload: req.body.message.payload,
      metadata: req.body.message.metadata,
    })
    msg = { message: { ...payload, tags: {}, discriminateByTags: [] } }
  }

  const initializeResponse = await props.client.initializeIncomingMessage({
    ...conversationRequest,
    ...userRequest,
    ...msg,
  })

  if (!userKey) {
    userKey = props.auth.generateKey({ id: initializeResponse.user.id })
  }

  const { conversation, user: userResponse, message: messageResponse } = initializeResponse

  const ev: InitialEvent = {
    type: 'init',
    data: {
      conversation,
      user: { ...userResponse, userKey },
      message: messageResponse?.message
        ? { ...messageResponse.message, ...msgPayload.mapBotpressMessageToChat(messageResponse.message) }
        : undefined,
    },
  }

  const body = createSSEMessage('init', ev)
  const contentLength = Buffer.byteLength(body, 'utf-8')

  const keepAliveMessage = createSSEMessage('message', 'ping')
  const b64KeepAlive = Buffer.from(keepAliveMessage, 'utf-8').toString('base64')

  return {
    body,
    headers: {
      'Content-Type': 'text/event-stream',
      'Content-Length': `${contentLength}`,
      'Grip-Hold': 'stream',
      'Grip-Channel': `${conversation.id},${userResponse.id}`,
      'Grip-Keep-Alive': `${b64KeepAlive}; format=base64; timeout=30;`,
    },
  }
}

function createSSEMessage(eventName: 'message' | 'init', event: any): string {
  const data = typeof event === 'string' ? event : JSON.stringify(event)
  return [`event: ${eventName}`, `data: ${data}`, '', ''].join('\n')
}
